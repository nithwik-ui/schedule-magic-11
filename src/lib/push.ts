// Lightweight Push helper: registers SW and subscribes to Push service
export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    return await navigator.serviceWorker.register('/sw.js');
  }
  throw new Error('Service workers not supported');
}

export async function subscribeToPush(serverBaseUrl: string, profile: any) {
  // serverBaseUrl should be like https://push.example.com or http://localhost:3000
  const reg = await registerServiceWorker();
  // fetch VAPID public key from server
  const keyRes = await fetch(`${serverBaseUrl.replace(/\/$/, '')}/vapidPublicKey`);
  if (!keyRes.ok) throw new Error('Failed to get VAPID key');
  const { publicKey } = await keyRes.json();
  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  // send subscription to server along with optional profile info
  const resp = await fetch(`${serverBaseUrl.replace(/\/$/, '')}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub, profile }),
  });
  if (!resp.ok) throw new Error('Failed to register subscription on server');
  return sub;
}
