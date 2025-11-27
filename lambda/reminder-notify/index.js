/**
 * EventBridge Schedulerから呼び出されるLambda関数
 * リマインダー通知を送信するHTTPエンドポイントを呼び出す
 */

import https from 'https';
import http from 'http';

export const handler = async (event) => {
    console.log('[Lambda] Event received:', JSON.stringify(event, null, 2));

    try {
        // EventBridge SchedulerからのイベントからリマインダーIDを取得
        let reminderId;

        if (event.reminderId) {
            // 直接reminderIdが含まれている場合
            reminderId = event.reminderId;
        } else if (event.Input) {
            // InputがJSON文字列の場合
            const input = JSON.parse(event.Input);
            reminderId = input.reminderId;
        } else if (event.detail && event.detail.reminderId) {
            // EventBridgeイベントの場合
            reminderId = event.detail.reminderId;
        } else {
            throw new Error('reminderId not found in event');
        }

        if (!reminderId) {
            throw new Error('reminderId is required');
        }

        console.log(`[Lambda] Processing reminder notification for: ${reminderId}`);

        // 通知APIのURL（環境変数から取得）
        const notifyApiUrl = process.env.NOTIFY_API_URL || 'https://main.da1pjhpif1fug.amplifyapp.com/api/reminders/notify';
        // 環境変数から取得したAPIキーをトリム（前後の空白文字を削除）
        const apiKey = process.env.REMINDER_NOTIFY_API_KEY?.trim();

        // デバッグログ
        console.log('[Lambda] NOTIFY_API_URL:', notifyApiUrl);
        console.log('[Lambda] REMINDER_NOTIFY_API_KEY is set:', !!apiKey);
        if (apiKey) {
            console.log('[Lambda] REMINDER_NOTIFY_API_KEY length:', apiKey.length);
        }

        // HTTPリクエストを送信
        const url = new URL(`${notifyApiUrl}/${reminderId}`);
        const urlString = url.toString();

        const headers = {
            'Content-Type': 'application/json',
        };

        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
            console.log('[Lambda] Authorization header will be sent');
        } else {
            console.warn('[Lambda] WARNING: REMINDER_NOTIFY_API_KEY is not set. Authorization header will not be sent.');
        }

        const requestOptions = {
            method: 'POST',
            headers: headers,
        };

        // HTTPリクエストを送信
        const response = await new Promise((resolve, reject) => {
            const protocol = url.protocol === 'https:' ? https : http;

            const req = protocol.request(urlString, requestOptions, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({
                            statusCode: res.statusCode,
                            body: data,
                        });
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.end();
        });

        console.log(`[Lambda] Successfully sent notification for reminder ${reminderId}:`, response);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                reminderId: reminderId,
                response: response,
            }),
        };
    } catch (error) {
        console.error('[Lambda] Error processing reminder notification:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message,
            }),
        };
    }
};

