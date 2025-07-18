// src/components/Instructions.jsx
// import Sidebar from "./Sidebar";
import icono from "/icono.png";

const Instructions = () => {
  return (
    <>
      <div className="px-4 max-w-3xl mx-auto scroll-smooth">
        <div className="flex items-center gap-4 mb-6">
          <img src={icono} alt="Icono de la app" className="w-10 h-10" />
          <h1 className="text-2xl font-bold">Instrucciones</h1>
        </div>

        {/* Índice */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">📚 Índice</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><a href="#bienvenida" className="text-blue-600 underline">Bienvenida</a></li>
            <li><a href="#como-jugar" className="text-blue-600 underline">¿Cómo se juega a la quiniela?</a></li>
            <li><a href="#registro" className="text-blue-600 underline">¿Cómo me registro e ingreso mis pronósticos?</a></li>
            <li><a href="#resultados" className="text-blue-600 underline">¿Cuándo se actualizan los resultados?</a></li>
            <li><a href="#ranking" className="text-blue-600 underline">Ranking</a></li>
            <li><a href="#precio" className="text-blue-600 underline">Sobre el precio y los premios</a></li>
            <li><a href="#olvido-password" className="text-blue-600 underline">¿Qué hacer si olvidé mi usuario o contraseña?</a></li>
            <li><a href="#instalar-ios" className="text-blue-600 underline">Cómo añadir esta página a tu pantalla de inicio (iOS) y recibir notificaciones</a></li>
            <li><a href="#dudas" className="text-blue-600 underline">¿Qué pasa si encuentro algún error en mis puntos o tengo alguna duda adicional?</a></li>
          </ul>
        </div>

        {/* Bienvenida */}
        <div id="bienvenida" className="scroll-mt-20">
          <h2 className="text-lg font-semibold mb-2">🎉 Bienvenida</h2>
          <img src="https://media.api-sports.io/football/leagues/262.png" alt="Liga MX" className="w-10 h-10 mb-2" />
          <p className="mb-4">
            Bienvenidos a la quiniela de la <strong>Liga MX Apertura 2025</strong>. Vamos a comenzar oficialmente a jugar a partir de la jornada 2.
            Actualmente el ranking muestra los resultados de la quiniela del Mundial de Clubes, pero durante la semana del 14 de julio todo será reseteado para dar inicio a esta nueva edición.
          </p>
        </div>

        <hr className="my-6" />

        {/* ¿Cómo se juega? */}
        <div id="como-jugar" className="scroll-mt-20">
          <h2 className="text-lg font-semibold mb-2">⚽ ¿Cómo se juega a la quiniela?</h2>
          <p className="mb-4">
            Debes ingresar tus pronósticos con marcador exacto para los partidos.
            <ul className="list-disc list-inside space-y-2">
              <li>1 punto si aciertas al resultado (gana local, empate o gana visita).</li>
              <li>3 puntos si además aciertas el marcador exacto.</li>
            </ul>
          </p>
        </div>

        <hr className="my-6" />

        {/* ¿Cómo registrarse? */}
        <div id="registro" className="scroll-mt-20">
          <h2 className="text-lg font-semibold mb-2">📝 ¿Cómo me registro e ingreso mis pronósticos?</h2>
          <p className="mb-4">
            Ve a “Iniciar sesión” y haz clic en “Regístrate”. Solo necesitas un nombre, correo y contraseña. Luego podrás iniciar sesión con esos datos.
          </p>
          <p className="mb-4">
            Los pronósticos pueden ser ingresados en la sección “Partidos” y sólo estarán disponibles para los partidos que comienzan dentro de los próximos 8 días.
          </p>
          <p className="mb-4">
            También puedes editar tus pronósticos en la sección “Mis pronósticos” (siempre que el partido no haya comenzado), y ahí mismo verás los pronósticos pasados y cuántos puntos ganaste.
          </p>
        </div>

        <hr className="my-6" />

        {/* Resultados */}
        <div id="resultados" className="scroll-mt-20">
          <h2 className="text-lg font-semibold mb-2">⏱️ ¿Cuándo se actualizan los resultados?</h2>
          <p className="mb-4">Los resultados se actualizan cada 30 minutos. No es en tiempo real, pero es bastante frecuente 😄.</p>
        </div>

        <hr className="my-6" />

        {/* Ranking */}
        <div id="ranking" className="scroll-mt-20">
          <h2 className="text-lg font-semibold mb-2">🏆 Ranking</h2>
          <p className="mb-4">
            Aquí puedes ver el ranking global de todos los participantes. Si quieres competir internamente con tus amigos, puedes crear un grupo desde la pestaña “Dashboard” y comparar posiciones entre ustedes.
          </p>
        </div>

        <hr className="my-6" />

        {/* Sección precio y premios */}
        <div id="precio" className="scroll-mt-20">
        <h2 className="text-lg font-semibold mb-2">💰 Sobre el precio y los premios</h2>
        <p className="mb-4">
            La participación en la quiniela tiene un costo de <strong>$200 pesos mexicanos</strong>.
            Este pago debe realizarse antes de que comiencen los partidos de la jornada 5, es decir, antes del <strong>15 de agosto</strong>.
        </p>
        <p className="mb-4">
            Si no se ha realizado el pago antes de esta fecha, la cuenta del usuario quedará <strong>inactiva</strong> y no podrá seguir participando en la quiniela.
        </p>
        <p className="mb-4">
            Los premios serán distribuidos entre los <strong>tres primeros lugares</strong> del ranking global:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4">
            <li>🥇 1er lugar: 70% del total acumulado</li>
            <li>🥈 2do lugar: 20%</li>
            <li>🥉 3er lugar: 10%</li>
        </ul>
        <p className="mb-4">
            Para realizar el pago, por favor contacta al administrador por WhatsApp 👉{" "}
            <a href="https://wa.me/13322052695" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
            wa.me/13322052695
            </a>
        </p>
        </div>

        <hr className="my-6" />

        {/* Olvidé mi contraseña */}
        <div id="olvido-password" className="scroll-mt-20">
          <h2 className="text-lg font-semibold mb-2">🔐 ¿Qué hacer si olvidé mi usuario o contraseña?</h2>
          <p className="mb-4">
            Si olvidaste tu contraseña o correo, contacta al administrador por WhatsApp:
            <a href="https://wa.me/13322052695" target="_blank" className="text-blue-600 underline ml-1">wa.me/13322052695</a>
          </p>
          <p className="mb-4">
            Él te generará un <strong>link único</strong> para que puedas ingresar una nueva contraseña y recuperar el acceso.
          </p>
        </div>

        <hr className="my-6" />

        {/* Añadir a inicio (iOS) */}
        <div id="instalar-ios" className="scroll-mt-20">
          <h2 className="text-lg font-semibold mb-2">📱 Cómo añadir esta página a tu pantalla de inicio (iOS) y recibir notificaciones</h2>
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
            Esto permitirá que la app se vea más bonita (sin barra de Safari) y que puedas recibir notificaciones push en el futuro.
          </p>
        </div>

        <hr className="my-6" />

        {/* Dudas o errores */}
        <div id="dudas" className="scroll-mt-20">
          <h2 className="text-lg font-semibold mb-2">❓ ¿Qué pasa si encuentro algún error en mis puntos o tengo alguna duda adicional?</h2>
          <p className="mb-4">
            Escríbele al administrador por WhatsApp:
            <a href="https://wa.me/13322052695" target="_blank" className="text-blue-600 underline ml-1">wa.me/13322052695</a>
            . Él podrá ayudarte con cualquier tema relacionado con tus puntos, partidos o funcionamiento de la app.
          </p>
        </div>

        <p className="mt-6">¡Gracias por participar y que gane el mejor! 🙌</p>
      </div>
    </>
  );
};

export default Instructions;