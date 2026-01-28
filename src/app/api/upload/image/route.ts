import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";

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

// 許可するMIMEタイプ
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/heic',      // iPhone標準形式（iOS 11以降）
  'image/heif',      // iPhone標準形式
];

// 許可する拡張子
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.heic', '.heif'];

// ファイルタイプ検証
function isValidImageFile(file: File): boolean {
  // MIMEタイプで検証
  if (ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return true;
  }

  // 拡張子で検証（MIMEタイプが不明な場合）
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (ALLOWED_EXTENSIONS.includes(extension)) {
    return true;
  }

  return false;
}

// POST /api/upload/image?groupId=xxx
// 画像ファイルをアップロード
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // ログインユーザー全員が使用可能（管理者のみから変更）
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 団体IDをクエリパラメータから取得
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId is required" },
        { status: 400 }
      );
    }

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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが選択されていません" },
        { status: 400 }
      );
    }

    // ファイルタイプ検証（PNG, JPG, JPEG, HEIC, HEIFのみ許可、動画は拒否）
    if (!isValidImageFile(file)) {
      // 動画形式の明示的な拒否
      const videoMimeTypes = ['video/', 'application/octet-stream'];
      const isVideo = videoMimeTypes.some(type => file.type.startsWith(type)) ||
        ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm'].some(ext =>
          file.name.toLowerCase().endsWith(ext)
        );

      if (isVideo) {
        return NextResponse.json(
          { error: "動画ファイルはアップロードできません。画像ファイル（PNG, JPG, JPEG）を選択してください" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "サポートされていないファイル形式です。PNG, JPG, JPEG形式の画像を選択してください" },
        { status: 400 }
      );
    }

    // ファイルサイズの検証（20MBまで）
    const MAX_UPLOAD_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: "ファイルサイズは20MB以下にしてください" },
        { status: 400 }
      );
    }

    // ファイルをバッファに変換
    const bytes = await file.arrayBuffer();
    const imageBuffer = Buffer.from(bytes);

    // sharpで画像を読み込み（メタデータを削除するため、まずメタデータを取得）
    let image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // リサイズが必要か判定（幅または高さが1920px超）
    const MAX_DIMENSION = 1920;
    const needsResize =
      (metadata.width && metadata.width > MAX_DIMENSION) ||
      (metadata.height && metadata.height > MAX_DIMENSION);

    // 画像処理パイプラインを構築
    // 1. メタデータ（EXIF、位置情報、撮影者情報など）を削除
    image = image.withMetadata({});

    // 2. リサイズ（必要な場合）
    if (needsResize) {
      // リサイズ実行（アスペクト比を維持）
      image = image.resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // 3. 形式変換（HEIC/HEIF形式の場合はJPEGに変換）
    // ファイル名から形式を判定（metadata.formatはHEIC/HEIFを正しく認識しない場合があるため）
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const isHeicOrHeif = fileExtension === '.heic' || fileExtension === '.heif';
    const format = metadata.format?.toLowerCase() || '';

    // 変換後の形式を判定（Content-Typeと拡張子の決定に使用）
    let outputFormat: 'jpeg' | 'png' = 'jpeg'; // デフォルトはJPEG
    let contentType: 'image/jpeg' | 'image/png' = 'image/jpeg';

    if (isHeicOrHeif || format === 'heic' || format === 'heif') {
      image = image.jpeg({ quality: 80 });
      outputFormat = 'jpeg';
      contentType = 'image/jpeg';
    } else if (format === 'jpeg' || format === 'jpg') {
      image = image.jpeg({ quality: 80 });
      outputFormat = 'jpeg';
      contentType = 'image/jpeg';
    } else if (format === 'png') {
      image = image.png({ compressionLevel: 6 });
      outputFormat = 'png';
      contentType = 'image/png';
    } else {
      // その他の形式はJPEGに変換（安全のため）
      image = image.jpeg({ quality: 80 });
      outputFormat = 'jpeg';
      contentType = 'image/jpeg';
    }

    // 最適化された画像をバッファに変換
    const optimizedBuffer = await image.toBuffer();

    // ファイル名を生成（タイムスタンプのみで元のファイル名は隠蔽）
    // 拡張子は変換後の形式に合わせる
    // 団体IDを含めて、団体ごとに画像を分離
    const timestamp = Date.now();
    const extension = outputFormat === 'png' ? '.png' : '.jpg';
    const s3Key = `uploads/images/${groupId}/${timestamp}${extension}`;

    // S3にアップロード
    if (!process.env.IMAGE_S3_BUCKET_NAME) {
      throw new Error("IMAGE_S3_BUCKET_NAME environment variable is not set");
    }

    // 認証情報の確認
    if (!process.env.IMAGE_S3_AWS_ACCESS_KEY_ID || !process.env.IMAGE_S3_AWS_SECRET_ACCESS_KEY) {
      throw new Error("IMAGE_S3_AWS_ACCESS_KEY_ID or IMAGE_S3_AWS_SECRET_ACCESS_KEY environment variable is not set");
    }

    const putCommand = new PutObjectCommand({
      Bucket: process.env.IMAGE_S3_BUCKET_NAME,
      Key: s3Key,
      Body: optimizedBuffer,
      ContentType: contentType, // 変換後の形式
      ServerSideEncryption: 'AES256', // IAMポリシーのConditionと一致させるため
    });

    await s3Client.send(putCommand);

    // アプリケーションのドメイン配下のURLを返却（S3の直接URLは返さない）
    const imageUrl = `/api/images/${s3Key}`;

    return NextResponse.json({ url: imageUrl }, { status: 200 });
  } catch (error) {
    console.error("Error uploading image:", error);

    // より詳細なエラーメッセージを返す
    let errorMessage = "画像のアップロードに失敗しました";
    let statusCode = 500;

    if (error instanceof Error) {
      // 環境変数が設定されていない場合
      if (error.message.includes("IMAGE_S3_BUCKET_NAME")) {
        errorMessage = "S3バケット名が設定されていません。環境変数IMAGE_S3_BUCKET_NAMEを設定してください。";
        statusCode = 500;
      }
      else if (error.message.includes("IMAGE_S3_AWS_ACCESS_KEY_ID") || error.message.includes("IMAGE_S3_AWS_SECRET_ACCESS_KEY")) {
        errorMessage = "S3アクセスキーが設定されていません。環境変数IMAGE_S3_AWS_ACCESS_KEY_IDとIMAGE_S3_AWS_SECRET_ACCESS_KEYを設定してください。";
        statusCode = 500;
      }
      // S3アクセスエラーの場合
      else if (error.message.includes("AccessDenied") || error.message.includes("Forbidden") || error.message.includes("403")) {
        errorMessage = "S3へのアクセス権限がありません。IAMポリシーを確認してください。";
        statusCode = 403;
      }
      // バケットが存在しない場合
      else if (error.message.includes("NoSuchBucket") || error.message.includes("404")) {
        errorMessage = "S3バケットが存在しません。バケット名を確認してください。";
        statusCode = 404;
      }
      // 認証エラーの場合
      else if (error.message.includes("InvalidAccessKeyId") || error.message.includes("SignatureDoesNotMatch")) {
        errorMessage = "S3アクセスキーが無効です。環境変数を確認してください。";
        statusCode = 403;
      }
      // その他のエラー
      else {
        errorMessage = `画像のアップロードに失敗しました: ${error.message}`;
        statusCode = 500;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
