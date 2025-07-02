// src/components/Changelog.jsx
import Sidebar from "./Sidebar";

const changelogEntries = [
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