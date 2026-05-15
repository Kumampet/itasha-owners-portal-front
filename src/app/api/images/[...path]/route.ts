import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// S3エラーの型定義
interface S3Error {
  name?: string;
  $metadata?: {
    httpStatusCode?: number;
  };
  message?: string;
}

// S3クライアントの初期化
const s3Client = new S3Client({
  region: process.env.APP_AWS_REGION || "ap-northeast-1",
  credentials: process.env.IMAGE_S3_AWS_ACCESS_KEY_ID && process.env.IMAGE_S3_AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.IMAGE_S3_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.IMAGE_S3_AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

// GET /api/images/[...path]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await auth();

    // ログインチェック
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { path } = await params;
    const s3Key = path.join('/');

    // セキュリティチェック: uploads/images/{groupId}/で始まるパスのみ許可
    if (!s3Key.startsWith('uploads/images/')) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }

    // パストラバーサル攻撃の防止
    if (s3Key.includes('..') || s3Key.includes('//') || s3Key.startsWith('/')) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }

    // S3キーから団体IDを抽出
    // 形式: uploads/images/{groupId}/{timestamp}.{ext}
    const pathParts = s3Key.split('/');
    if (pathParts.length < 4 || pathParts[0] !== 'uploads' || pathParts[1] !== 'images') {
      return NextResponse.json(
        { error: "Invalid path format" },
        { status: 400 }
      );
    }

    const groupId = pathParts[2];

    // 団体が存在するか確認
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // ユーザーがこの団体に参加しているか確認
    const userGroup = await prisma.userGroup.findUnique({
      where: {
        user_id_group_id: {
          user_id: session.user.id,
          group_id: groupId,
        },
      },
    });

    // オーナー（リーダー）の場合はUserGroupに存在しなくてもアクセス可能
    const isLeader = group.leader_user_id === session.user.id;
    if (!userGroup && !isLeader) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    if (!process.env.IMAGE_S3_BUCKET_NAME) {
      return NextResponse.json(
        { error: "S3 bucket not configured" },
        { status: 500 }
      );
    }

    // 認証情報の確認
    if (!process.env.IMAGE_S3_AWS_ACCESS_KEY_ID || !process.env.IMAGE_S3_AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: "S3 credentials not configured" },
        { status: 500 }
      );
    }

    // まずHeadObjectCommandでメタデータを取得（キャッシュチェック用）
    const headCommand = new HeadObjectCommand({
      Bucket: process.env.IMAGE_S3_BUCKET_NAME,
      Key: s3Key,
    });

    let headResponse;
    try {
      headResponse = await s3Client.send(headCommand);
    } catch (headError) {
      // S3エラーの型をチェック
      const error = headError as S3Error;
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return NextResponse.json(
          { error: "Image not found" },
          { status: 404 }
        );
      }
      throw headError;
    }

    // ETagとLastModifiedを取得
    const etag = headResponse.ETag?.replace(/"/g, '') || '';
    const lastModified = headResponse.LastModified;

    // リクエストヘッダーからIf-None-MatchとIf-Modified-Sinceを取得
    const ifNoneMatch = request.headers.get('if-none-match');
    const ifModifiedSince = request.headers.get('if-modified-since');

    // キャッシュが有効な場合、304 Not Modifiedを返す
    // （アクセス制御は既に上で確認済み）
    // ETagの比較（クォートあり/なしの両方に対応）
    if (etag && ifNoneMatch) {
      const normalizedIfNoneMatch = ifNoneMatch.replace(/"/g, '');
      const normalizedEtag = etag.replace(/"/g, '');
      if (normalizedIfNoneMatch === normalizedEtag) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'ETag': `"${etag}"`,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Expires': new Date(Date.now() + 31536000 * 1000).toUTCString(),
          },
        });
      }
    }

    // Last-Modifiedの比較
    if (lastModified && ifModifiedSince) {
      const lastModifiedDate = new Date(lastModified);
      const ifModifiedSinceDate = new Date(ifModifiedSince);
      // 1秒の誤差を許容
      if (lastModifiedDate.getTime() <= ifModifiedSinceDate.getTime() + 1000) {
        const notModifiedHeaders: Record<string, string> = {
          'Last-Modified': lastModified.toUTCString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Expires': new Date(Date.now() + 31536000 * 1000).toUTCString(),
        };
        if (etag) {
          notModifiedHeaders['ETag'] = `"${etag}"`;
        }
        return new NextResponse(null, {
          status: 304,
          headers: notModifiedHeaders,
        });
      }
    }

    // S3から画像を取得
    const command = new GetObjectCommand({
      Bucket: process.env.IMAGE_S3_BUCKET_NAME,
      Key: s3Key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Content-Typeを設定（変換後の形式に合わせる）
    // S3キーから拡張子を取得して判定（S3のメタデータは変換前の形式の可能性があるため）
    let contentType = 'image/jpeg'; // デフォルトはJPEG
    const extension = s3Key.toLowerCase().substring(s3Key.lastIndexOf('.'));
    if (extension === '.png') {
      contentType = 'image/png';
    } else {
      // JPEG, HEIC, HEIF等は全てJPEG形式で保存されているため
      contentType = 'image/jpeg';
    }

    // ストリーミングレスポンスを返却（メモリ効率的）
    // 大きな画像の場合でもメモリ使用量を抑えるため、ストリームをそのまま返す
    const stream = response.Body as Readable;

    // レスポンスヘッダーを構築（ブラウザキャッシュを最大限に活用）
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      // 1年間キャッシュ（immutableで変更されないことを示す）
      'Cache-Control': 'public, max-age=31536000, immutable',
      // Expiresヘッダーも追加（古いブラウザ対応）
      'Expires': new Date(Date.now() + 31536000 * 1000).toUTCString(),
      // プリロードを許可
      'Accept-Ranges': 'bytes',
    };

    // ETagとLast-Modifiedを追加（条件付きリクエスト用）
    if (etag) {
      headers['ETag'] = `"${etag}"`;
    }
    if (lastModified) {
      headers['Last-Modified'] = lastModified.toUTCString();
    }

    // 画像データを返却（キャッシュヘッダー付き）
    // ReadableストリームをNextResponseで返す
    // NextResponseはNode.jsのReadableストリームも受け付けるが、型定義上はunknownを経由してキャスト
    return new NextResponse(stream as unknown as BodyInit, {
      headers,
    });
  } catch (error) {
    console.error("Error fetching image from S3:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}
