import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "../utils/axiosConfig";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const baseUrl = import.meta.env.VITE_API_URL;

function CrearCompetencia() {
  const { authToken } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [ligas, setLigas] = useState([]);
  const [ligaSeleccionada, setLigaSeleccionada] = useState(null);

  useEffect(() => {
    const fetchLigas = async () => {
      try {
        const response = await axios.get(`${baseUrl}/competitions/leagues`);
        setLigas(response.data);
      } catch (error) {
        console.error("Error al obtener ligas:", error);
      }
    };

    fetchLigas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ligaSeleccionada) {
      alert("Selecciona una liga para la competencia");
      return;
    }

    try {
      await axios.post(
        `${baseUrl}/competitions/`,
        {
          name: nombre,
          is_public: isPublic,
          leagues: [ligaSeleccionada],
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          }
        }
      );
      alert("Competencia creada con éxito");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error al crear competencia:", error);
      alert("Hubo un error al crear la competencia");
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="max-w-xl mx-auto mt-10 px-4 w-full">
        <h1 className="text-2xl font-bold mb-6">Crear nueva competencia</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Nombre:</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Privacidad:</label>
            <select
              value={isPublic ? "publica" : "privada"}
              onChange={(e) => setIsPublic(e.target.value === "publica")}
              className="w-full border rounded px-3 py-2"
            >
              <option value="publica">Pública</option>
              <option value="privada">Privada (requiere código)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Liga:</label>
            <select
              value={ligaSeleccionada?.league_id || ""}
              onChange={(e) => {
                const selected = ligas.find((l) => l.league_id === parseInt(e.target.value));
                setLigaSeleccionada(selected);
              }}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Selecciona una liga</option>
              {ligas.map((liga) => (
                <option key={`${liga.league_id}-${liga.league_season}`} value={liga.league_id}>
                  {liga.league_name} ({liga.league_season})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded hover:bg-blue-700"
          >
            Crear competencia
          </button>
        </form>
      </div>
    </div>
  );
}

export default CrearCompetencia;