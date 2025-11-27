// Service Worker for Push Notifications
// 参考: https://zenn.dev/ktraw1574/articles/15c7db663efc76

const CACHE_NAME = "itasha-portal-v1";

// インストール時の処理
self.addEventListener("install", function (event) {
  console.log("[Service Worker] Installing...");
  // すぐにアクティブにする（PWA環境でも正しく動作するように）
  event.waitUntil(self.skipWaiting());
});

// skipWaitingメッセージを受信した場合
self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[Service Worker] Received SKIP_WAITING message");
    self.skipWaiting();
  }
});

// アクティベート時の処理
self.addEventListener("activate", function (event) {
  console.log("[Service Worker] Activating...");
  // すべてのクライアントを制御する
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // 古いキャッシュを削除
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[Service Worker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
    ])
  );
  console.log("[Service Worker] Activated");
});

// Push通知の処理
self.addEventListener("push", function (event) {
  console.log("[Service Worker] Push event received");
  console.log("[Service Worker] Event data:", event.data ? "present" : "missing");
  
  let data = {};
  
  try {
    if (event.data) {
      // webpushライブラリから送信されるデータは通常JSON文字列
      // まずjson()メソッドを試す
      try {
        data = event.data.json();
        console.log("[Service Worker] Parsed push data as JSON:", data);
      } catch (jsonError) {
        console.log("[Service Worker] Failed to parse as JSON, trying text:", jsonError);
        // json()が失敗した場合、text()で取得してJSONパースを試みる
        try {
          const text = event.data.text();
          console.log("[Service Worker] Push data as text:", text);
          if (text) {
            data = JSON.parse(text);
            console.log("[Service Worker] Parsed push data from text:", data);
          }
        } catch {
          // JSONでない場合は、テキストをそのまま使用（開発者ツールからのテストなど）
          const text = event.data.text();
          console.log("[Service Worker] Push data is not JSON, using as text:", text);
          data = { body: text, title: "通知" };
        }
      }
    } else {
      console.warn("[Service Worker] Push event has no data");
    }
  } catch (error) {
    console.error("[Service Worker] Error processing push data:", error);
    data = {};
  }

  const title = data.title || "リマインダー";
  const body = data.body || "リマインダーが設定時刻になりました";
  
  // iOS SafariのPush通知に対応するため、オプションを調整
  const options = {
    body: body,
    tag: data.tag || "reminder",
    data: data.data || {},
    // iOS Safariでは、requireInteraction: falseが推奨される
    requireInteraction: false,
    // iOS Safariでは、silent: falseが必須（trueの場合、通知が表示されない）
    silent: false,
    // アイコンとバッジを追加（データに含まれている場合はそれを使用）
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    // iOS Safariでは、vibrateとsoundは無視されるが、エラーを避けるため設定しない
  };

  console.log("[Service Worker] Showing notification:", { title, options });

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log("[Service Worker] Notification shown successfully");
      })
      .catch((error) => {
        console.error("[Service Worker] Failed to show notification:", error);
      })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const data = event.notification.data;
  let url = "/app/reminder";
  
  if (data && data.url) {
    url = data.url;
  } else if (data && data.reminderId) {
    url = `/app/reminder`;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // 既に開いているウィンドウがあれば、それをフォーカス
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      // 開いているウィンドウがなければ、新しいウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

