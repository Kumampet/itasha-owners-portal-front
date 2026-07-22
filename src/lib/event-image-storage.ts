import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  deleteLocalEventImagesByEventId,
  isGroupImageStorageLocal,
} from "@/lib/group-image-local-store";
import { getR2Client } from "@/lib/r2";



/**
 * イベントIDごとのディレクトリ配下を空にする（差し替え時）
 */
export async function deleteEventImageStorage(eventId: string): Promise<void> {
  if (isGroupImageStorageLocal()) {
    // await deleteLocalEventImagesByEventId(eventId);
    return;
  }

  if (!process.env.R2_BUCKET_NAME) {
    console.warn("R2_BUCKET_NAME is not set, skipping event image deletion");
    return;
  }

  if (
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY
  ) {
    console.warn("S3 credentials are not set, skipping event image deletion");
    return;
  }

  const prefix = `uploads/images/events/${eventId}/`;
  let continuationToken: string | undefined;

  const s3Client = getR2Client();
  try {
    do {
      const listResponse = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: process.env.R2_BUCKET_NAME,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        await Promise.all(
          listResponse.Contents.map((object) => {
            if (!object.Key) return Promise.resolve();
            return s3Client.send(
              new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: object.Key,
              }),
            );
          }),
        );
      }

      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);
  } catch (error) {
    console.error(`Error deleting S3 images for event ${eventId}:`, error);
    throw error;
  }
}
