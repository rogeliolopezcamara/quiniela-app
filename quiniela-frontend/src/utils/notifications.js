// src/utils/notifications.js
const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Registrar el service worker
export async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("Service Worker registrado:", registration);
    return registration;
  } else {
    console.warn("El navegador no soporta Service Workers");
    return null;
  }
}

// Pedir permiso para mostrar notificaciones
export async function askNotificationPermission() {
  if (!("Notification" in window)) return false;

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

// Generar y enviar la suscripción push
export async function subscribeUserToPush(registration, authToken) {
  if (!registration || !registration.pushManager) {
    console.error("Service Worker no disponible para push");
    return;
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
  });

  console.log("Push Subscription:", subscription);

  // Enviar al backend
  await fetch(`${import.meta.env.VITE_API_URL}/subscribe`, {
    method: "POST",
    body: JSON.stringify(subscription),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });
}

// Función auxiliar para convertir clave VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}