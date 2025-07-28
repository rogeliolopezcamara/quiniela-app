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

  const [editPredictionId, setEditPredictionId] = useState(null);
  const [editValues, setEditValues] = useState({ pred_home: 0, pred_away: 0 });

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

  const {
    data: userPredictions = [],
    isLoading: loadingUserPredictions,
    error: errorUserPredictions,
    refetch: refetchUserPredictions,
  } = useQuery({
    queryKey: ['userPredictionsFlat', competenciaSeleccionada],
    queryFn: async () => {
      let response;
      if (competenciaSeleccionada === "todas") {
        response = await axios.get(`${baseUrl}/my-predictions/`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } else {
        response = await axios.get(`${baseUrl}/my-predictions/${competenciaSeleccionada}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
      // Garantiza que siempre se devuelva un arreglo
      return Array.isArray(response.data)
        ? response.data.filter(pred => pred.status_short === "NS")
        : [];
    },
    enabled: !!authToken,
    refetchInterval: 10000,
    // Asegura que el valor por defecto sea un arreglo
    // (ya está cubierto en data: userPredictions = [])
  });

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
      refetchUserPredictions();
    } catch (error) {
      console.error("Error al enviar el pronóstico:", error);
      alert("Hubo un error al enviar el pronóstico");
    }
  };

  const handleEditSubmit = async (e, prediction_id) => {
    e.preventDefault();
    try {
      await axios.put(`${baseUrl}/predictions/${prediction_id}`, editValues, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      refetchUserPredictions();
      setEditPredictionId(null);
    } catch (error) {
      console.error("Error al editar el pronóstico:", error);
      alert("Hubo un error al editar el pronóstico");
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

  if (loadingCompetencias || loadingMatches || loadingUserPredictions) {
    return <div className="text-center mt-10 text-gray-600">Cargando...</div>;
  }

  if (errorCompetencias || errorMatches || errorUserPredictions) {
    return <div className="text-center mt-10 text-red-600">Error al cargar la información.</div>;
  }

  return (
    <div className="flex">
      <div className="w-full px-4 sm:px-8">
        <div className="bg-white border rounded-md p-3 shadow-sm mb-6 max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Competencia:</span>
            <select
              value={competenciaSeleccionada}
              onChange={(e) => setCompetenciaSeleccionada(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="todas">Todas</option>
              {competencias.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-4 mt-6">Partidos sin pronóstico</h2>

        {matches.length === 0 ? (
          <p className="text-sm text-center text-gray-500 mb-6">
            No hay partidos disponibles para pronosticar en los próximos 8 días.
          </p>
        ) : null}

        {Object.entries(groupedMatches).map(([round, roundMatches]) => (
          <div key={round} className="mb-10">
            <h3 className="text-base font-medium mb-3">{round}</h3>
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

        <h2 className="text-lg font-semibold mb-4 mt-10">Tus pronósticos enviados</h2>
        {userPredictions.length === 0 ? (
          <p className="text-sm text-center text-gray-500 mb-6">
            No tienes pronósticos enviados para partidos próximos.
          </p>
        ) : (
          (() => {
            // Agrupa por ronda
            const groupedUserPredictions = userPredictions.reduce((acc, pred) => {
              const round = pred.league_round || "Otros";
              if (!acc[round]) acc[round] = [];
              acc[round].push(pred);
              return acc;
            }, {});
            return Object.entries(groupedUserPredictions).map(([round, preds]) => (
              <div key={round} className="mb-8">
                <h3 className="text-base font-medium mb-3">{round}</h3>
                {preds.map(pred => (
                  <div key={pred.prediction_id} className="bg-gray-100 p-4 mb-4 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <img src={pred.home_team_logo} alt={pred.home_team} className="w-6 h-6" />
                        <span className="font-semibold">{pred.home_team}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{pred.away_team}</span>
                        <img src={pred.away_team_logo} alt={pred.away_team} className="w-6 h-6" />
                      </div>
                    </div>
                    <p className="text-sm text-center text-gray-600 mb-2">{formatDate(pred.match_date)}</p>
                    {editPredictionId === pred.prediction_id ? (
                      <form onSubmit={(e) => handleEditSubmit(e, pred.prediction_id)} className="flex gap-2 justify-center">
                        <input
                          type="number"
                          value={editValues.pred_home}
                          onChange={(e) => setEditValues({ ...editValues, pred_home: parseInt(e.target.value) })}
                          className="border rounded px-2 py-1 w-16"
                          min="0"
                          required
                        />
                        <span>-</span>
                        <input
                          type="number"
                          value={editValues.pred_away}
                          onChange={(e) => setEditValues({ ...editValues, pred_away: parseInt(e.target.value) })}
                          className="border rounded px-2 py-1 w-16"
                          min="0"
                          required
                        />
                        <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded">Guardar</button>
                        <button type="button" onClick={() => setEditPredictionId(null)} className="text-sm text-gray-500 underline">Cancelar</button>
                      </form>
                    ) : (
                      <>
                        <div className="flex justify-center items-center gap-2 text-lg font-semibold text-gray-800 mb-2">
                          <span>{pred.pred_home}</span>
                          <span>-</span>
                          <span>{pred.pred_away}</span>
                        </div>
                        <button
                          onClick={() => {
                            setEditPredictionId(pred.prediction_id);
                            setEditValues({ pred_home: pred.pred_home, pred_away: pred.pred_away });
                          }}
                          className="mt-2 bg-yellow-500 text-white px-3 py-1 rounded text-sm shadow"
                        >
                          Editar
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ));
          })()
        )}
      </div>
    </div>
  );
};

export default AvailableMatches;