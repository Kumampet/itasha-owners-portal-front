
import {
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

  const awsClient = getR2Client();
  try {
    do {
      let url = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}?prefix=${encodeURIComponent(prefix)}&list-type=2`;
      if (continuationToken) {
        url += `&continuation-token=${encodeURIComponent(continuationToken)}`;
      }

      const listResponse = await awsClient.fetch(url, { method: "GET" });
      if (!listResponse.ok) {
        throw new Error(`Failed to list objects: ${listResponse.status}`);
      }

      const xml = await listResponse.text();
      const keys = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map(m => m[1]);
      const nextTokenMatch = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/);

      if (keys.length > 0) {
        const deletePromises = keys.map((key) => {
          const deleteUrl = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/${key}`;
          return awsClient.fetch(deleteUrl, { method: "DELETE" });
        });
        await Promise.all(deletePromises);
      }

      continuationToken = nextTokenMatch ? nextTokenMatch[1] : undefined;
    } while (continuationToken);
  } catch (error) {
    console.error(`Error deleting S3 images for event ${eventId}:`, error);
    throw error;
  }
}
