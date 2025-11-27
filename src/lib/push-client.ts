// クライアント側のPush通知ユーティリティ

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    throw new Error("このブラウザは通知をサポートしていません");
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    throw new Error("通知が拒否されています。ブラウザの設定から許可してください。");
  }

  const permission = await Notification.requestPermission();
  return permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("このブラウザはService Workerをサポートしていません");
  }

  try {
    // 既存のService Worker登録を確認（すべての登録を確認）
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`[Service Worker] Found ${registrations.length} existing registration(s)`);
    
    // /sw.jsで登録されているService Workerを探す（PWA環境でも正しく動作するように）
    for (const registration of registrations) {
      const scriptURL = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL;
      if (scriptURL && scriptURL.includes("/sw.js")) {
        console.log("[Service Worker] Existing registration found:", registration.scope);
        console.log("[Service Worker] Script URL:", scriptURL);
        // アクティブなService Workerを返す（なければ待機中のものを返す）
        if (registration.active) {
          return registration;
        }
      }
    }

    // Service Workerを登録（参考サイトの実装に合わせて）
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("[Service Worker] Registered:", registration.scope);
    
    // アクティベーションを待つ（PWA環境でも正しく動作するように）
    if (registration.installing) {
      await new Promise<void>((resolve) => {
        registration.installing!.addEventListener("statechange", function () {
          if (this.state === "activated") {
            console.log("[Service Worker] Activated");
            resolve();
          }
        });
      });
    } else if (registration.waiting) {
      // 待機中のService Workerがある場合は、skipWaitingを呼び出す
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      await new Promise<void>((resolve) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", function () {
              if (this.state === "activated") {
                console.log("[Service Worker] Activated after skipWaiting");
                resolve();
              }
            });
          }
        });
      });
    }
    
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    throw error;
  }
}

export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey || vapidPublicKey.trim() === "") {
      throw new Error("VAPID公開キーが設定されていません。環境変数NEXT_PUBLIC_VAPID_PUBLIC_KEYを確認してください。");
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });

    return subscription;
  } catch (error) {
    console.error("Push subscription failed:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Push通知のサブスクリプションに失敗しました");
  }
}

export async function unsubscribeFromPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Push unsubscription failed:", error);
    throw error;
  }
}

// VAPID公開キーをUint8Arrayに変換
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

