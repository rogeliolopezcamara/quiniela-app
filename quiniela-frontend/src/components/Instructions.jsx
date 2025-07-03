import Sidebar from "./Sidebar";

function Instructions() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64 pt-16 p-6 max-w-4xl">
        <div className="flex items-center mb-6">
          <img src="/icono.png" alt="Ícono" className="w-10 h-10 mr-4" />
          <h1 className="text-3xl font-bold">Instrucciones</h1>
        </div>

        <p className="mb-4">
          Amigos! Les cuento que estoy desarrollando una web-app para hacer quinielas con tus amigos de forma sencilla. La idea es que puedas entrar a la página, ingresar tus pronósticos, y que la app descargue automáticamente los resultados de los partidos para calcular los puntos.
        </p>

        <p className="mb-4">
          En este momento la app está en una versión muy inicial, así que le faltan muchas cosas: desde mejorar el diseño hasta implementar nuevas funcionalidades. La meta es tener una versión sólida para el próximo Mundial.
        </p>

        <p className="mb-4">
          Por eso, quería pedirles su ayuda para ser alpha-testers y jugar una pequeña quiniela con los partidos que quedan del Mundial de Clubes.
        </p>

        <p className="mb-4">
          Para participar, solo tienen que entrar a 👉 <a href="https://quiniela-frontend.onrender.com/" className="text-blue-500 underline">https://quiniela-frontend.onrender.com/</a>, registrarse, y luego iniciar sesión para ingresar sus pronósticos en la sección “Partidos”.
        </p>

        <p className="mb-4">
          Y para hacerlo un poquito más interesante, el ganador de la quiniela se llevará <strong>$50 USD</strong> de premio 🤑 (siempre y cuando den su feedback, y como el presupuesto es limitado, si hay varios ganadores tendrán que repartirlo 😅).
        </p>

        <hr className="my-6" />

        <h2 className="text-xl font-bold mb-2">📝 Algunas consideraciones:</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Al registrarse, no usen un correo real, solo asegúrense de que tenga formato válido (por ejemplo: algo@ejemplo.com).</li>
          <li>Tampoco usen una contraseña real. No hay restricciones, así que puede ser algo corto y fácil de recordar.</li>
          <li>Los resultados de los partidos (y por lo tanto los puntos de la quiniela) se actualizan una vez al día, aunque en algunos casos puedo ejecutar la rutina manualmente en otro momento.</li>
          <li>El servidor tiene recursos bastante limitados, así que les pido paciencia, sobre todo al iniciar sesión o crear un nuevo usuario.</li>
          <li>Por esa misma razón, no inviten a más gente por ahora. Si todo sale bien, más adelante podré abrir la app a nuevos usuarios.</li>
          <li>La app fue diseñada en computadora, así que en el celular (especialmente en vertical) se ve fea 😅 (aún más). Les recomiendo usar el celular en modo horizontal.</li>
          <li>Yo también estoy haciendo pruebas, así que verán mi usuario en el ranking, pero no participo oficialmente.</li>
          <li>Así se asignan los puntos: 1 punto si aciertas el resultado (quién gana) y 3 puntos si aciertas el marcador exacto, considerando tiempo regular y tiempos extra.</li>
        </ul>

        <hr className="my-6" />

        <h2 className="text-xl font-bold mb-2">🛠 Me ayudaría mucho si pudieran compartir:</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Errores o bugs que encuentren.</li>
          <li>Posibles problemas de seguridad.</li>
          <li>Ideas de funcionalidades que les gustaría tener.</li>
          <li>Recomendaciones sobre diseño o experiencia de usuario.</li>
        </ul>

        <p className="mt-6">Gracias por su apoyo 🙌 Ojalá se animen a participar y podamos divertirnos un rato con lo que queda del torneo. ¡Se agradece muchísimo!</p>
      </div>
    </div>
  );
}

export default Instructions;
