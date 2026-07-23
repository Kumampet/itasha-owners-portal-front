import { AwsClient } from "aws4fetch";

export const getR2Client = () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2 credentials in environment variables");
  }

  return new AwsClient({
    accessKeyId,
    secretAccessKey,
    region: "auto",
    service: "s3",
  });
};

