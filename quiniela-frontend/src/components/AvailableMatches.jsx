// src/components/AvailableMatches.jsx
import { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { useQuery } from '@tanstack/react-query';
import Sidebar from "./Sidebar";

const baseUrl = import.meta.env.VITE_API_URL;

const AvailableMatches = () => {
  const [competenciaSeleccionada, setCompetenciaSeleccionada] = useState(() => {
    return localStorage.getItem("availableMatchesCompetencia") || "todas";
  });
  useEffect(() => {
    localStorage.setItem("availableMatchesCompetencia", competenciaSeleccionada);
  }, [competenciaSeleccionada]);
  const { authToken } = useAuth();

  const {
    data: competencias = [],
    isLoading: loadingCompetencias,
    error: errorCompetencias,
  } = useQuery({
    queryKey: ['userCompetitions'],
    queryFn: async () => {
      const res = await axios.get(`${baseUrl}/my-competitions-with-stats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return res.data;
    },
    enabled: !!authToken,
    staleTime: 1000 * 60,
  });

  const {
    data: matches = [],
    isLoading: loadingMatches,
    error: errorMatches,
    refetch,
  } = useQuery({
    queryKey: ['availableMatches', competenciaSeleccionada],
    queryFn: async () => {
      let response;
      if (competenciaSeleccionada === "todas") {
        response = await axios.get(`${baseUrl}/available-matches/`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } else {
        response = await axios.get(`${baseUrl}/available-matches/${competenciaSeleccionada}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }

      const now = new Date();
      const in8Days = new Date();
      in8Days.setDate(now.getDate() + 8);

      return response.data.filter((match) => {
        const matchDate = new Date(match.match_date);
        return matchDate <= in8Days;
      });
    },
    enabled: !!authToken,
    refetchInterval: 10000,
  });

  if (loadingCompetencias || loadingMatches) {
    return <div className="text-center mt-10 text-gray-600">Cargando...</div>;
  }

  if (errorCompetencias || errorMatches) {
    return <div className="text-center mt-10 text-red-600">Error al cargar la información.</div>;
  }

  const handleSubmit = async (match_id, pred_home, pred_away) => {
    try {
      await axios.post(
        `${baseUrl}/predictions/`,
        { match_id, pred_home, pred_away },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      alert("Pronóstico enviado correctamente");
      refetch();
    } catch (error) {
      console.error("Error al enviar el pronóstico:", error);
      alert("Hubo un error al enviar el pronóstico");
    }
  };

  const normalizeISOString = (s) => (s.endsWith("Z") ? s : s + "Z");

  const formatDate = (isoString) => {
    const localDate = new Date(normalizeISOString(isoString));
    return localDate.toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const groupedMatches = matches.reduce((acc, match) => {
    const round = match.league_round || "Otros";
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {});

  return (
    <div className="flex">
      <div className="w-full px-4 sm:px-8">
        <div className="max-w-xs mx-auto mb-6">
          <label className="block font-semibold mb-1 text-center">Selecciona una competencia:</label>
          <select
            value={competenciaSeleccionada}
            onChange={(e) => setCompetenciaSeleccionada(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="todas">Todas</option>
            {competencias.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
        </div>

        {matches.length === 0 ? (
          <p className="text-sm text-center text-gray-500 mb-6">
            No hay partidos disponibles para pronosticar en los próximos 8 días.
          </p>
        ) : (
          <p className="text-sm text-center text-gray-500 mb-6">
            * Las fechas y horas se muestran en tu horario local.
          </p>
        )}

        {Object.entries(groupedMatches).map(([round, roundMatches]) => (
          <div key={round} className="mb-10">
            <h2 className="text-lg font-semibold mb-4">{round}</h2>

            {roundMatches.map((match) => (
              <div key={match.match_id} className="bg-gray-100 p-4 mb-6 rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img src={match.home_team_logo} alt={match.home_team} className="w-6 h-6" />
                    <span className="font-semibold">{match.home_team}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{match.away_team}</span>
                    <img src={match.away_team_logo} alt={match.away_team} className="w-6 h-6" />
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-2 text-center">{formatDate(match.match_date)}</p>

                <form
                  className="flex items-center gap-2 justify-center"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target;
                    const pred_home = form.elements[`home_${match.match_id}`].value;
                    const pred_away = form.elements[`away_${match.match_id}`].value;
                    handleSubmit(match.match_id, parseInt(pred_home), parseInt(pred_away));
                  }}
                >
                  <input
                    name={`home_${match.match_id}`}
                    type="number"
                    placeholder="Local"
                    className="border rounded px-2 py-1 w-16"
                    required
                    min="0"
                  />
                  <span>-</span>
                  <input
                    name={`away_${match.match_id}`}
                    type="number"
                    placeholder="Visita"
                    className="border rounded px-2 py-1 w-16"
                    required
                    min="0"
                  />
                  <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
                    Enviar
                  </button>
                </form>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableMatches;