// Service Worker for Push Notifications
self.addEventListener("push", function (event) {
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: "通知", body: event.data.text() || "新しい通知があります" };
    }
  }

  const title = data.title || "通知";
  const options = {
    body: data.body || "新しい通知があります",
    icon: data.icon || "/images/main_logo_square.png",
    badge: data.badge || "/images/main_logo_square.png",
    data: data.data || {},
    tag: data.tag || "default",
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 通知クリック時の処理
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url || "/app/mypage";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // 既に開いているウィンドウがあればそこにフォーカス
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      // 新しいウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

