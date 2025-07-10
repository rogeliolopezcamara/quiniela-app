// src/components/Instructions.jsx
import Sidebar from "./Sidebar";
import icono from "/icono.png";

const Instructions = () => {
  return (
    <>
      <Sidebar />
      <div className="pt-20 px-4 max-w-3xl mx-auto scroll-smooth">
        <div className="flex items-center gap-4 mb-6">
          <img src={icono} alt="Icono de la app" className="w-10 h-10" />
          <h1 className="text-2xl font-bold">Instrucciones</h1>
        </div>

        {/* Índice */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">📚 Índice</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <a href="#instalar-ios" className="text-blue-600 underline">
                Cómo añadir esta página a tu pantalla de inicio (iOS)
              </a>
            </li>
            <li>
              <a href="#alpha-testing" className="text-blue-600 underline">
                Instrucciones de alpha testing
              </a>
            </li>
            <li>
              <a href="#olvido-password" className="text-blue-600 underline">
                ¿Qué hacer si olvidé mi contraseña?
              </a>
            </li>
          </ul>
        </div>

        {/* Sección iOS */}
        <div id="instalar-ios" className="scroll-mt-20">
          <h2 className="text-lg font-semibold mb-2">📱 Cómo añadir esta página a tu pantalla de inicio (iOS)</h2>
          <p className="mb-4">
            Si estás usando un iPhone o iPad, sigue estos pasos para agregar la app como si fuera una aplicación nativa:
          </p>
          <ol className="list-decimal list-inside space-y-2 mb-6">
            <li>Abre esta página desde el navegador Safari.</li>
            <li>Toca el botón de <strong>compartir</strong> (el icono de un cuadrado con una flecha hacia arriba).</li>
            <li>Selecciona <strong>"Agregar a pantalla de inicio"</strong>.</li>
            <li>Cambia el nombre si lo deseas, luego toca <strong>"Agregar"</strong>.</li>
            <li>¡Listo! Ahora podrás acceder a la app desde el ícono en tu pantalla como si fuera una app instalada.</li>
          </ol>
          <p className="mb-4">
            Nota: Esto permite que la app tenga su propio entorno independiente (sin barra de Safari) y te permitirá recibir notificaciones push en el futuro.
          </p>
        </div>

        <hr className="my-6" />

        {/* Sección alpha testing */}
        <div id="alpha-testing" className="scroll-mt-20">
          <h2 className="text-lg font-semibold mb-4">🧪 Instrucciones de alpha testing</h2>
          <p className="mb-4">
            Amigos! Les cuento que estoy desarrollando una web-app para hacer quinielas con tus amigos de forma sencilla.
            La idea es que puedas entrar a la página, ingresar tus pronósticos, y que la app descargue automáticamente los resultados
            de los partidos para calcular los puntos.
          </p>
          <p className="mb-4">
            En este momento la app está en una versión muy inicial, así que le faltan muchas cosas: desde mejorar el diseño hasta
            implementar nuevas funcionalidades. La meta es tener una versión sólida para el próximo Mundial.
          </p>
          <p className="mb-4">
            Por eso, quería pedirles su ayuda para ser alpha-testers y jugar una pequeña quiniela con los partidos que quedan del Mundial de Clubes.
          </p>
          <p className="mb-4">
            Para participar, solo tienen que entrar a 👉{" "}
            <a href="https://quiniela-frontend.onrender.com/" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              https://quiniela-frontend.onrender.com/
            </a>, registrarse, y luego iniciar sesión para ingresar sus pronósticos en la sección “Partidos”.
          </p>
          <p className="mb-4">
            Y para hacerlo un poquito más interesante, el ganador de la quiniela se llevará <strong>$50 USD</strong> de premio 🤑
            (siempre y cuando den su feedback, y como el presupuesto es limitado, si hay varios ganadores tendrán que repartirlo 😅).
          </p>

          <hr className="my-6" />

          <h2 className="text-lg font-semibold mb-2">📝 Algunas consideraciones:</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Al registrarse, no usen un correo real, solo asegúrense de que tenga formato válido (por ejemplo: algo@ejemplo.com).</li>
            <li>Tampoco usen una contraseña real. No hay restricciones, así que puede ser algo corto y fácil de recordar.</li>
            <li>Los resultados de los partidos (y por lo tanto los puntos de la quiniela) se actualizan una vez al día, aunque en algunos casos puedo ejecutarlo manualmente.</li>
            <li>El servidor tiene recursos bastante limitados, así que les pido paciencia, sobre todo al iniciar sesión o crear un nuevo usuario.</li>
            <li>No inviten a más gente por ahora. Si todo sale bien, más adelante podré abrir la app a nuevos usuarios.</li>
            <li>La app fue diseñada en computadora, así que en el celular (especialmente en vertical) se ve fea 😅. Les recomiendo usar el celular en modo horizontal.</li>
            <li>Yo también estoy haciendo pruebas, así que verán mi usuario en el ranking, pero no participo oficialmente.</li>
            <li>Así se asignan los puntos: 1 punto si aciertas el resultado (quién gana) y 3 puntos si aciertas el marcador exacto, considerando tiempo regular y tiempos extra.</li>
          </ul>
        </div>

        <hr className="my-6" />

        {/* Sección olvido contraseña */}
        <div id="olvido-password" className="scroll-mt-20">
          <h2 className="text-lg font-semibold mb-2">🔐 ¿Qué hacer si olvidé mi contraseña?</h2>
          <p className="mb-4">
            Si olvidaste tu contraseña, por ahora no hay una funcionalidad automática para restablecerla. Pero no te preocupes:
          </p>
          <p className="mb-4">
            Solo tienes que contactar al administrador de la app. Él te generará un <strong>link único</strong> con el que podrás ingresar una nueva contraseña y recuperar el acceso a tu cuenta.
          </p>
          <p className="mb-4">
            En futuras versiones, se añadirá una opción directa desde la pantalla de inicio de sesión.
          </p>
        </div>

        <p className="mt-6">Gracias por su apoyo 🙌 ¡Ojalá se animen a participar y podamos divertirnos un rato con lo que queda del torneo!</p>
      </div>
    </>
  );
};

export default Instructions;