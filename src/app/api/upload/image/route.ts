import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import {
  isGroupImageStorageLocal,
  // writeLocalGroupImage,
} from "@/lib/group-image-local-store";
import { deleteEventImageStorage } from "@/lib/event-image-storage";

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

type OptimizeResult = {
  buffer: Buffer;
  contentType: "image/jpeg" | "image/png";
  extension: ".jpg" | ".png";
};

async function optimizeUploadedImage(
  file: File,
  options?: { forceJpeg?: boolean },
): Promise<OptimizeResult> {
  const bytes = await file.arrayBuffer();
  const imageBuffer = Buffer.from(bytes);

  let image = sharp(imageBuffer);
  const metadata = await image.metadata();

  const MAX_DIMENSION = 1920;
  const needsResize =
    (metadata.width && metadata.width > MAX_DIMENSION) ||
    (metadata.height && metadata.height > MAX_DIMENSION);

  image = image.withMetadata({});

  if (needsResize) {
    image = image.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  const isHeicOrHeif = fileExtension === '.heic' || fileExtension === '.heif';
  const format = metadata.format?.toLowerCase() || '';

  if (options?.forceJpeg) {
    image = image.jpeg({ quality: 80 });
    const buffer = await image.toBuffer();
    return { buffer, contentType: "image/jpeg", extension: ".jpg" };
  }

  let outputFormat: 'jpeg' | 'png' = 'jpeg';
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
    image = image.jpeg({ quality: 80 });
    outputFormat = 'jpeg';
    contentType = 'image/jpeg';
  }

  const buffer = await image.toBuffer();
  const extension = outputFormat === 'png' ? '.png' : '.jpg';
  return { buffer, contentType, extension };
}

async function putOptimizedImage(
  s3Key: string,
  optimizedBuffer: Buffer,
  contentType: "image/jpeg" | "image/png",
): Promise<void> {
  if (isGroupImageStorageLocal()) {
    // await writeLocalGroupImage(s3Key, optimizedBuffer);
    NextResponse.json({ success: true, message: "Temporarily mocked for Cloudflare migration" });
    return;
  }

  if (!process.env.IMAGE_S3_BUCKET_NAME) {
    throw new Error("IMAGE_S3_BUCKET_NAME environment variable is not set");
  }

  if (
    !process.env.IMAGE_S3_AWS_ACCESS_KEY_ID ||
    !process.env.IMAGE_S3_AWS_SECRET_ACCESS_KEY
  ) {
    throw new Error(
      "IMAGE_S3_AWS_ACCESS_KEY_ID or IMAGE_S3_AWS_SECRET_ACCESS_KEY environment variable is not set",
    );
  }

  const putCommand = new PutObjectCommand({
    Bucket: process.env.IMAGE_S3_BUCKET_NAME,
    Key: s3Key,
    Body: optimizedBuffer,
    ContentType: contentType,
    ServerSideEncryption: "AES256",
  });

  await s3Client.send(putCommand);
}

// POST /api/upload/image?groupId=xxx | POST /api/upload/image?eventId=xxx
// 画像ファイルをアップロード
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const eventId = searchParams.get("eventId");

    if ((!groupId && !eventId) || (groupId && eventId)) {
      return NextResponse.json(
        { error: "groupId または eventId のどちらか一方を指定してください" },
        { status: 400 }
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

    if (!isValidImageFile(file)) {
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

    const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: "ファイルサイズは20MB以下にしてください" },
        { status: 400 }
      );
    }

    let s3Key: string;
    let optimizedBuffer: Buffer;
    let contentType: "image/jpeg" | "image/png";

    if (groupId) {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        return NextResponse.json(
          { error: "Group not found" },
          { status: 404 }
        );
      }

      const userGroup = await prisma.userGroup.findUnique({
        where: {
          user_id_group_id: {
            user_id: session.user.id,
            group_id: groupId,
          },
        },
      });

      const isLeader = group.leader_user_id === session.user.id;
      if (!userGroup && !isLeader) {
        return NextResponse.json(
          { error: "You are not a member of this group" },
          { status: 403 }
        );
      }

      const opt = await optimizeUploadedImage(file);
      optimizedBuffer = opt.buffer;
      contentType = opt.contentType;
      const timestamp = Date.now();
      const extension = opt.extension;
      s3Key = `uploads/images/${groupId}/${timestamp}${extension}`;
    } else {
      const id = eventId as string;

      if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        );
      }

      const event = await prisma.event.findUnique({
        where: { id },
        select: { id: true, created_by_user_id: true },
      });

      if (!event) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      if (
        session.user.role === "ORGANIZER" &&
        event.created_by_user_id !== session.user.id
      ) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        );
      }

      const opt = await optimizeUploadedImage(file, { forceJpeg: true });
      optimizedBuffer = opt.buffer;
      contentType = opt.contentType;

      await deleteEventImageStorage(id);
      s3Key = `uploads/images/events/${id}/thumbnail.jpg`;
    }

    await putOptimizedImage(s3Key, optimizedBuffer, contentType);

    const imageUrl =
      s3Key.startsWith("uploads/images/events/")
        ? `/api/images/${s3Key}?v=${Date.now()}`
        : `/api/images/${s3Key}`;
    return NextResponse.json({ url: imageUrl }, { status: 200 });
  } catch (error) {
    console.error("Error uploading image:", error);

    let errorMessage = "画像のアップロードに失敗しました";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("IMAGE_S3_BUCKET_NAME")) {
        errorMessage = "S3バケット名が設定されていません。環境変数IMAGE_S3_BUCKET_NAMEを設定してください。";
        statusCode = 500;
      }
      else if (error.message.includes("IMAGE_S3_AWS_ACCESS_KEY_ID") || error.message.includes("IMAGE_S3_AWS_SECRET_ACCESS_KEY")) {
        errorMessage = "S3アクセスキーが設定されていません。環境変数IMAGE_S3_AWS_ACCESS_KEY_IDとIMAGE_S3_AWS_SECRET_ACCESS_KEYを設定してください。";
        statusCode = 500;
      }
      else if (error.message.includes("AccessDenied") || error.message.includes("Forbidden") || error.message.includes("403")) {
        errorMessage = "S3へのアクセス権限がありません。IAMポリシーを確認してください。";
        statusCode = 403;
      }
      else if (error.message.includes("NoSuchBucket") || error.message.includes("404")) {
        errorMessage = "S3バケットが存在しません。バケット名を確認してください。";
        statusCode = 404;
      }
      else if (error.message.includes("InvalidAccessKeyId") || error.message.includes("SignatureDoesNotMatch")) {
        errorMessage = "S3アクセスキーが無効です。環境変数を確認してください。";
        statusCode = 403;
      }
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
