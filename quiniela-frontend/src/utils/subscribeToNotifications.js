const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export async function subscribeToNotifications() {
  if (!("serviceWorker" in navigator)) {
    console.warn("🚫 Service Workers no soportados en este navegador.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("❌ El usuario no concedió permiso para notificaciones.");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      console.log("✅ Ya estás suscrito a notificaciones.");
      return;
    }

    console.log("🔔 Intentando suscribirse a notificaciones...");
    console.log("🔑 Clave pública VAPID:", publicVapidKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });

    const json = subscription.toJSON();
    const payload = {
      endpoint: json.endpoint,
      p256dh_key: json.keys.p256dh,
      auth_key: json.keys.auth,
    };

    console.log("📦 Payload a enviar:", payload);

    const token = localStorage.getItem("token");

    const res = await fetch(`${import.meta.env.VITE_API_URL}/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("📨 Respuesta del servidor:", res.status);

    if (!res.ok) throw new Error("Error al guardar suscripción");

    console.log("✅ Suscripción guardada exitosamente.");
  } catch (err) {
    console.error("❌ Error al suscribirse a notificaciones:", err);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i)
    outputArray[i] = rawData.charCodeAt(i);

  return outputArray;
}