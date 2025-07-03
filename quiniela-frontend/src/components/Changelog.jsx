// src/components/Changelog.jsx
import Sidebar from "./Sidebar";

const changelogEntries = [
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
      <Sidebar />
      <div className="pt-20 px-4 max-w-3xl mx-auto">
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