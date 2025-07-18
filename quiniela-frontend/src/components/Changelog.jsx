// src/components/Changelog.jsx
// import Sidebar from "./Sidebar";

const changelogEntries = [
{
  date: "2025-06-27",
  items: [
    "Se implementó la funcionalidad para crear grupos privados con un código de invitación único.",
    "Se agregó un procedimiento para recuperar la contraseña olvidada mediante un enlace de restablecimiento",
  ],
},
{
  date: "2025-07-10",
  items: [
    "Se implementó un sistema de notificaciones push para recordar a los usuarios hacer su pronóstico antes de cada partido.",
    "El backend envía notificaciones si falta menos de 24 horas o menos de 1 hora para un partido y el usuario aún no ha hecho su predicción.",
    "Se agregó el registro automático de Service Worker para habilitar las notificaciones push.",
    "Se actualizó el componente de Instrucciones para incluir pasos sobre cómo añadir la app a la pantalla de inicio en dispositivos iOS.",
    "Mejoras de compatibilidad para dispositivos móviles, incluyendo la configuración como PWA en Safari.",
  ],
},
{
  date: "2025-07-07",
  items: [
    "Se detecta automáticamente el vencimiento del token y se cierra la sesión con un mensaje al usuario.",
    "Se cambió el formato de fecha a 'dd/mm/aaaa, HH:mm' y se muestra en horario local del usuario.",
    "Se agregaron los logos de los equipos en las páginas de partidos disponibles y de pronósticos del usuario.",
    "Se agregaron nuevas columnas a la tabla 'matches' en la base de datos: league_id, league_name, league_logo, league_season, league_round, home_team_logo, y away_team_logo.",
    "La tabla de ranking ahora muestra columnas por ronda ('league_round') con los puntos de cada usuario en cada una.",
    "Se puede ordenar la tabla de ranking por cualquier columna, incluyendo rondas individuales y puntos totales.",
    "La vista de 'Tus pronósticos' ahora es responsiva: en dispositivos móviles los datos se muestran como tarjetas para una mejor experiencia.",
  ],
},
{
date: "2025-06-27",
items: [
    "Se corrigió un error que impedía recargar las páginas correctamente.",
    "Se creó la nueva página de Instrucciones y se colocó como página de inicio.",
    "Se actualizó el Sidebar para mostrar el botón de iniciar sesión cuando no hay sesión activa.",
    "Se cambió el formato de fecha a dd/mm/aaaa en el Dashboard y se estableció como el nuevo formato estándar.",
    "La tabla de ranking ahora resalta en verde la fila del usuario autenticado.",
    "Se eliminó la columna de correo en la tabla de ranking.",
    "Ahora la información de los partidos se actualiza cada 30 minutos automáticamente.",
],
},
  {
    date: "2025-06-27",
    items: [
      "Se agregó la página de Novedades.",
      "El sidebar ahora está por encima del contenido principal y se despliega con un botón.",
      "Se corrigió un error que al registrarse no mostraba el mensaje de éxito.",
      "El botón de logout ahora siempre es visible en móviles.",
      "El dashboard ahora muestra nombre, email y puntos.",
    ],
  },
  {
    date: "2025-06-25",
    items: [
      "Se integró el sidebar en todas las páginas.",
      "Los partidos desaparecen después de hacer el pronóstico.",
    ],
  },
  // Puedes seguir agregando entradas
];

const Changelog = () => {
  return (
    <>
      <div className="px-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Novedades</h1>
        {changelogEntries.map((entry) => (
          <div key={entry.date} className="mb-6">
            <h2 className="text-lg font-semibold mb-2">{entry.date}</h2>
            <ul className="list-disc list-inside space-y-1">
              {entry.items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
};

export default Changelog;