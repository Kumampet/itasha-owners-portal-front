// Service Worker for Push Notifications
self.addEventListener("push", function (event) {
  let data = {};
  
  try {
    if (event.data) {
      // webpushライブラリから送信されるデータは通常JSON文字列
      // まずjson()メソッドを試す
      try {
        data = event.data.json();
      } catch {
        // json()が失敗した場合、text()で取得してJSONパースを試みる
        try {
          const text = event.data.text();
          if (text) {
            data = JSON.parse(text);
          }
        } catch {
          // JSONでない場合は、テキストをそのまま使用（開発者ツールからのテストなど）
          const text = event.data.text();
          console.log("[Service Worker] Push data is not JSON, using as text:", text);
          data = { body: text, title: "通知" };
        }
      }
    }
  } catch (error) {
    console.error("[Service Worker] Error processing push data:", error);
    data = {};
  }

  const title = data.title || "リマインダー";
  const options = {
    body: data.body || "リマインダーが設定時刻になりました",
    tag: data.tag || "reminder",
    data: data.data || {},
    requireInteraction: false,
    silent: false,
  };

  // アイコンが指定されている場合のみ追加
  if (data.icon) {
    options.icon = data.icon;
  }
  if (data.badge) {
    options.badge = data.badge;
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
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
    clients.openWindow(url)
  );
});

