import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { groups, userGroups, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  isGroupImageStorageLocal,
  readLocalGroupImage,
} from "@/lib/group-image-local-store";

// S3エラーの型定義
interface S3Error {
  name?: string;
  $metadata?: {
    httpStatusCode?: number;
  };
  message?: string;
}
import { getR2Client } from "@/lib/r2";

// S3クライインターフェースの初期化
const s3Client = getR2Client();
type ImageCacheMode = "immutable" | "replaceable";

function cacheControlHeader(mode: ImageCacheMode): string {
  if (mode === "immutable") {
    return "public, max-age=31536000, immutable";
  }
  return "public, max-age=600, stale-while-revalidate=3600";
}

async function serveStoredImage(
  request: NextRequest,
  s3Key: string,
  cacheMode: ImageCacheMode,
): Promise<NextResponse> {
  if (isGroupImageStorageLocal()) {
    const local = await readLocalGroupImage(s3Key);
    if (!local) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }
    const etag = `W/"${local.size}-${local.mtime.getTime()}"`;
    const ifNoneMatch = request.headers.get("if-none-match");
    const cc = cacheControlHeader(cacheMode);
    if (ifNoneMatch) {
      const normalizedReq = ifNoneMatch.replace(/"/g, "");
      const normalizedEtag = etag.replace(/"/g, "");
      if (normalizedReq === normalizedEtag || normalizedReq === etag) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            ETag: etag,
            "Cache-Control": cc,
            Expires: new Date(Date.now() + 31536000 * 1000).toUTCString(),
            "Last-Modified": local.mtime.toUTCString(),
          },
        });
      }
    }
    let contentType = "image/jpeg";
    const extension = s3Key.toLowerCase().substring(s3Key.lastIndexOf("."));
    if (extension === ".png") {
      contentType = "image/png";
    }
    return new NextResponse(new Uint8Array(local.buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cc,
        Expires: new Date(Date.now() + 31536000 * 1000).toUTCString(),
        "Accept-Ranges": "bytes",
        ETag: etag,
        "Last-Modified": local.mtime.toUTCString(),
      },
    });
  }

  if (!process.env.R2_BUCKET_NAME) {
    return NextResponse.json(
      { error: "S3 bucket not configured" },
      { status: 500 }
    );
  }

  if (!process.env.IMAGE_S3_AWS_ACCESS_KEY_ID || !process.env.IMAGE_S3_AWS_SECRET_ACCESS_KEY) {
    return NextResponse.json(
      { error: "S3 credentials not configured" },
      { status: 500 }
    );
  }

  const headCommand = new HeadObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: s3Key,
  });

  let headResponse;
  try {
    headResponse = await s3Client.send(headCommand);
  } catch (headError) {
    const error = headError as S3Error;
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }
    throw headError;
  }

  const etag = headResponse.ETag?.replace(/"/g, '') || '';
  const lastModified = headResponse.LastModified;
  const cc = cacheControlHeader(cacheMode);

  const ifNoneMatch = request.headers.get('if-none-match');
  const ifModifiedSince = request.headers.get('if-modified-since');

  if (etag && ifNoneMatch) {
    const normalizedIfNoneMatch = ifNoneMatch.replace(/"/g, '');
    const normalizedEtag = etag.replace(/"/g, '');
    if (normalizedIfNoneMatch === normalizedEtag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': `"${etag}"`,
          'Cache-Control': cc,
          'Expires': new Date(Date.now() + 31536000 * 1000).toUTCString(),
        },
      });
    }
  }

  if (lastModified && ifModifiedSince) {
    const lastModifiedDate = new Date(lastModified);
    const ifModifiedSinceDate = new Date(ifModifiedSince);
    if (lastModifiedDate.getTime() <= ifModifiedSinceDate.getTime() + 1000) {
      const notModifiedHeaders: Record<string, string> = {
        'Last-Modified': lastModified.toUTCString(),
        'Cache-Control': cc,
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

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: s3Key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    return NextResponse.json(
      { error: "Image not found" },
      { status: 404 }
    );
  }

  let contentType = 'image/jpeg';
  const extension = s3Key.toLowerCase().substring(s3Key.lastIndexOf('.'));
  if (extension === '.png') {
    contentType = 'image/png';
  } else {
    contentType = 'image/jpeg';
  }

  const stream = response.Body as Readable;

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': cc,
    'Expires': new Date(Date.now() + 31536000 * 1000).toUTCString(),
    'Accept-Ranges': 'bytes',
  };

  if (etag) {
    headers['ETag'] = `"${etag}"`;
  }
  if (lastModified) {
    headers['Last-Modified'] = lastModified.toUTCString();
  }

  return new NextResponse(stream as unknown as BodyInit, {
    headers,
  });
}

// GET /api/images/[...path]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const s3Key = path.join('/');

    if (!s3Key.startsWith('uploads/images/')) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }

    if (s3Key.includes('..') || s3Key.includes('//') || s3Key.startsWith('/')) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }

    const pathParts = s3Key.split('/');
    if (pathParts.length < 4 || pathParts[0] !== 'uploads' || pathParts[1] !== 'images') {
      return NextResponse.json(
        { error: "Invalid path format" },
        { status: 400 }
      );
    }

    const isEventThumbnail =
      pathParts[2] === 'events' &&
      pathParts.length === 5 &&
      /^thumbnail\.jpe?g$/i.test(pathParts[4]);

    if (isEventThumbnail) {
      const eventId = pathParts[3];
      const event = await db
        .select({ id: events.id })
        .from(events)
        .where(eq(events.id, eventId))
        .get();

      if (!event) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      return serveStoredImage(request, s3Key, "replaceable");
    }

    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const groupId = pathParts[2];
    if (groupId === 'events') {
      return NextResponse.json(
        { error: "Invalid path format" },
        { status: 400 }
      );
    }

    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    const userGroup = await db
      .select()
      .from(userGroups)
      .where(
        and(
          eq(userGroups.userId, session.user.id),
          eq(userGroups.groupId, groupId)
        )
      )
      .get();

    const isLeader = group.leaderUserId === session.user.id;
    if (!userGroup && !isLeader) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    return serveStoredImage(request, s3Key, "immutable");
  } catch (error) {
    console.error("Error fetching image from S3:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}
