import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "../utils/axiosConfig";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useTranslation } from "react-i18next";

const baseUrl = import.meta.env.VITE_API_URL;

function CrearCompetencia({ onSuccess }) {
  const { authToken } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
      alert(t('select_league_alert'));
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
      alert(t('competition_created_success'));
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 0);
    } catch (error) {
      console.error("Error al crear competencia:", error);
      alert(t('competition_create_error'));
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="max-w-xl mx-auto mt-10 px-4 w-full">
        <h1 className="text-2xl font-bold mb-6">{t('create_new_competition')}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">{t('name')}:</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">{t('privacy')}:</label>
            <select
              value={isPublic ? "publica" : "privada"}
              onChange={(e) => setIsPublic(e.target.value === "publica")}
              className="w-full border rounded px-3 py-2"
            >
              <option value="publica">{t('public')}</option>
              <option value="privada">{t('private_requires_code')}</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">{t('league')}:</label>
            <select
              value={ligaSeleccionada?.league_id || ""}
              onChange={(e) => {
                const selected = ligas.find((l) => l.league_id === parseInt(e.target.value));
                setLigaSeleccionada(selected);
              }}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">{t('select_league')}</option>
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
            {t('create_competition')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CrearCompetencia;