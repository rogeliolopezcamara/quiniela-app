import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "../utils/axiosConfig";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const baseUrl = import.meta.env.VITE_API_URL;

function UnirseCompetencia({ onSuccess }) {
  const { authToken } = useAuth();
  const navigate = useNavigate();

  const [competenciasPublicas, setCompetenciasPublicas] = useState([]);
  const [codigoPrivado, setCodigoPrivado] = useState("");
  const [inscritasIds, setInscritasIds] = useState([]);

  useEffect(() => {
    const fetchCompetenciasPublicas = async () => {
      try {
        const inscritas = await axios.get(`${baseUrl}/my-competitions-with-stats`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        setInscritasIds(inscritas.data.map((c) => c.id));

        const response = await axios.get(`${baseUrl}/competitions/public`);
        const disponibles = response.data.filter((c) => !inscritas.data.map((c) => c.id).includes(c.id));
        setCompetenciasPublicas(disponibles);
      } catch (error) {
        console.error("Error al obtener competencias públicas:", error);
      }
    };

    fetchCompetenciasPublicas();
  }, [authToken]);

  const unirsePorCodigo = async () => {
    if (!codigoPrivado) return;

    const yaInscrito = inscritasIds.includes(codigoPrivado);
    if (yaInscrito) {
      alert("Ya estás inscrito en esta competencia.");
      return;
    }

    try {
      await axios.post(`${baseUrl}/competitions/join/${codigoPrivado}`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      alert("Te uniste a la competencia correctamente");
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 0);
    } catch (error) {
      console.error("Error al unirse:", error);
      alert("No se pudo unir a la competencia. Verifica el código.");
    }
  };

  const unirseDirecto = async (code, compId) => {
    const yaInscrito = inscritasIds.includes(compId);
    if (yaInscrito) {
      alert("Ya estás inscrito en esta competencia.");
      return;
    }

    try {
      await axios.post(`${baseUrl}/competitions/join/${code}`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      alert("Te uniste a la competencia correctamente");
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 0);
    } catch (error) {
      console.error("Error al unirse:", error);
      alert("No se pudo unir a la competencia.");
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="max-w-xl mx-auto mt-10 px-4 w-full">
        <h1 className="text-2xl font-bold mb-6">Unirse a una competencia</h1>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">🔓 Competencias públicas</h2>
          {competenciasPublicas.length === 0 ? (
            <p className="text-gray-600">No hay competencias públicas disponibles.</p>
          ) : (
            <ul className="space-y-3">
              {competenciasPublicas.map((comp) => (
                <li key={comp.code} className="border p-3 rounded shadow">
                  <p><strong>Nombre:</strong> {comp.name}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {comp.leagues.map((league, index) => (
                      <div key={index} className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded">
                        {league.league_logo && (
                          <img src={league.league_logo} alt="logo" className="w-6 h-6" />
                        )}
                        <span>{league.league_name} ({league.league_season})</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => unirseDirecto(comp.code, comp.id)}
                    className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Unirse
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">🔒 Competencia privada</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={codigoPrivado}
              onChange={(e) => setCodigoPrivado(e.target.value)}
              placeholder="Código de invitación"
              className="border rounded px-3 py-2 w-full"
            />
            <button
              onClick={unirsePorCodigo}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Unirse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnirseCompetencia;