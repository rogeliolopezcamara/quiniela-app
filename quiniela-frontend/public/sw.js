self.addEventListener("push", function (event) {
  const data = event.data?.json();

  const title = data?.title || "¡Tienes una notificación!";
  const options = {
    body: data?.body || "",
    icon: "/icono.png",
    badge: "/icono.png",
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});