import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// AWS SESクライアントの初期化
const sesClient = new SESClient({
  region: process.env.APP_AWS_REGION || "ap-northeast-1",
  credentials: process.env.APP_AWS_ACCESS_KEY_ID && process.env.APP_AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

// メール送信関数
export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  const from = process.env.SES_FROM_EMAIL || "noreply@example.com";

  try {
    const command = new SendEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: body,
            Charset: "UTF-8",
          },
        },
      },
    });

    const response = await sesClient.send(command);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}


