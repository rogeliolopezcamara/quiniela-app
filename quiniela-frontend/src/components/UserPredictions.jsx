// src/components/UserPredictions.jsx
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useQuery } from "@tanstack/react-query";
import axios from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

const baseUrl = import.meta.env.VITE_API_URL;

// Pulsating dot style (animation duration will be set via CSS class)
const pulsatingDotStyle = {
  // Deprecated: now handled by CSS class
};

const UserPredictions = () => {
  const { t } = useTranslation();
  const { authToken } = useAuth();
  const [editPredictionId, setEditPredictionId] = useState(null);
  const [editValues, setEditValues] = useState({ pred_home: '', pred_away: '' });
  const [competenciaSeleccionada, setCompetenciaSeleccionada] = useState(() => {
    return localStorage.getItem("userPredictionsCompetencia") || "todas";
  });
  const [collapsedRounds, setCollapsedRounds] = useState(() => {
    try {
      const stored = localStorage.getItem("collapsedRounds");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("userPredictionsCompetencia", competenciaSeleccionada);
  }, [competenciaSeleccionada]);

  useEffect(() => {
    localStorage.setItem("collapsedRounds", JSON.stringify(collapsedRounds));
  }, [collapsedRounds]);

  // useQuery for competencias
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

  // Normalizar la selección cacheada y evitar 403 por competencias inválidas
  useEffect(() => {
    if (!authToken) return;
    if (
      competenciaSeleccionada !== "todas" &&
      Array.isArray(competencias) && competencias.length > 0 &&
      !competencias.some(c => String(c.id) === String(competenciaSeleccionada))
    ) {
      setCompetenciaSeleccionada("todas");
      localStorage.setItem("userPredictionsCompetencia", "todas");
    }
  }, [authToken, competencias, competenciaSeleccionada]);

  // useQuery for predictions (guarded, handle 403, prevent invalid selection)
  const {
    data: predictions = {},
    isLoading: loadingPredictions,
    error: errorPredictions,
    refetch: refetchPredictions,
  } = useQuery({
    queryKey: ['userPredictions', competenciaSeleccionada, (competencias || []).map(c => c.id).join(',')],
    queryFn: async () => {
      try {
        const endpoint =
          competenciaSeleccionada === "todas"
            ? `${baseUrl}/my-predictions/`
            : `${baseUrl}/my-predictions/${competenciaSeleccionada}`;
        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        // Filter only started matches
        const now = new Date();
        const started = Array.isArray(response.data)
          ? response.data.filter(pred => new Date(normalizeISOString(pred.match_date)) <= now)
          : [];

        // 1. Crear ronda especial "En vivo" con partidos en vivo
        const isLive = (p) => !["FT", "AET", "PEN"].includes(p.status_short);
        const liveMatches = started.filter(isLive);
        // Ordenar partidos en vivo por fecha ascendente
        const sortedLive = [...liveMatches].sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

        // 2. Agrupar el resto por league_round, excluyendo partidos en vivo
        const liveIds = new Set(liveMatches.map(p => p.prediction_id));
        const notLiveMatches = started.filter(p => !liveIds.has(p.prediction_id));

        // 3. Agrupar por league_round
        const groupedRounds = notLiveMatches.reduce((acc, curr) => {
          const round = curr.league_round || 'Sin ronda';
          if (!acc[round]) acc[round] = [];
          acc[round].push(curr);
          return acc;
        }, {});
        // Ordenar partidos en cada ronda por match_date ascendente
        for (const round in groupedRounds) {
          groupedRounds[round].sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
        }

        // 4. Asegurar que "En vivo" va primero
        const result = {};
        if (sortedLive.length > 0) {
          result["En vivo"] = sortedLive;
        }
        // El resto de las rondas, ordenadas naturalmente por número
        const extractLastNumber = (s) => {
          const m = String(s).match(/(\d+)(?!.*\d)/);
          return m ? parseInt(m[1], 10) : null;
        };
        const sortedRounds = Object.keys(groupedRounds).sort((a, b) => {
          const na = extractLastNumber(a);
          const nb = extractLastNumber(b);
          if (na != null && nb != null) return nb - na; // reverse numeric order (latest first)
          if (na != null) return -1;
          if (nb != null) return 1;
          return String(b).localeCompare(String(a)); // fallback reverse alphabetical
        });
        for (const round of sortedRounds) {
          result[round] = groupedRounds[round];
        }
        return result;
      } catch (err) {
        if (err?.response?.status === 403) {
          setCompetenciaSeleccionada("todas");
          localStorage.setItem("userPredictionsCompetencia", "todas");
          return {};
        }
        throw err;
      }
    },
    enabled: !!authToken && (
      competenciaSeleccionada === 'todas' ||
      (Array.isArray(competencias) && competencias.some(c => String(c.id) === String(competenciaSeleccionada)))
    ),
    refetchInterval: 10000,
  });

  const handleEditClick = (prediction) => {
    setEditPredictionId(prediction.prediction_id);
    setEditValues({ pred_home: prediction.pred_home, pred_away: prediction.pred_away });
  };

  const handleEditSubmit = async (e, prediction_id) => {
    e.preventDefault();
    try {
      await axios.put(
        `${baseUrl}/predictions/${prediction_id}`,
        editValues,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      // Refetch predictions after successful edit
      refetchPredictions();
      setEditPredictionId(null);
    } catch (error) {
      console.error("Error al editar el pronóstico:", error);
      alert("Hubo un error al editar el pronóstico");
    }
  };

  const normalizeISOString = (s) => s.endsWith("Z") ? s : s + "Z";

  const isEditable = (match_date) => {
    const localMatchDate = new Date(normalizeISOString(match_date));
    const now = new Date(); // local time
    return localMatchDate > now;
  };

  // Replaced by getMatchStatus below

  // Helper for match status, returning also color and animation classes
  const getMatchStatus = (match) => {
    const ended = ["FT", "AET", "PEN"].includes(match.status_short);
    if (ended) {
      return {
        text: "Terminado",
        isLive: false,
        dotClass: "bg-gray-400",
        animate: "",
      };
    }
    return {
      text: `En vivo - ${match.status_elapsed ?? 0}’`,
      isLive: true,
      dotClass: "bg-green-400",
      animate: "animate-pulse-custom",
    };
  };

  const toggleRoundCollapse = (round) => {
    setCollapsedRounds(prev => ({
      ...prev,
      [round]: !prev[round],
    }));
  };

  // Loading and error messages
  if (loadingCompetencias || loadingPredictions) {
    return <div className="text-center mt-10 text-gray-600">{t('loading')}</div>;
  }
  if (errorCompetencias || errorPredictions) {
    return <div className="text-center mt-10 text-red-600">{t('error_loading_data')}</div>;
  }

  return (
    <>
      {/* Pulsating dot keyframes style */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.2; }
          100% { opacity: 1; }
        }
        .animate-pulse-custom {
          animation: pulse 2s infinite;
        }
      ` }} />
      <div className="flex">
      <div className="px-4 w-full max-w-7xl mx-auto">
        <div className="bg-white border rounded-md p-3 shadow-sm mb-6 max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{t('competition')}:</span>
            <select
              value={competenciaSeleccionada}
              onChange={(e) => setCompetenciaSeleccionada(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="todas">{t('all')}</option>
              {competencias.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {Object.keys(predictions).length === 0 ? (
          <p className="text-center">{t('no_predictions')}</p>
        ) : (
          <>

            {/* Versión mobile (tarjetas) */}
            <div className="flex flex-col gap-4 md:hidden">
              {Object.entries(predictions).map(([round, preds]) => (
                <div key={round}>
                  <div className="flex items-center justify-between border-b-4 border-gray-300 px-1 py-2 mb-2">
                    <span className="font-semibold text-sm">
                      {competenciaSeleccionada === "todas" && preds.length > 0 && round !== "En vivo"
                        ? `${preds[0].league_name} - ${round}`
                        : round}
                    </span>
                    <button
                      onClick={() => toggleRoundCollapse(round)}
                      className={`transform transition-transform duration-200 ${
                        collapsedRounds[round] ? "rotate-0" : "rotate-90"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  {!collapsedRounds[round] && (
                  <div className="flex flex-col gap-4 mb-6">
                    {preds.map((pred) => (
                      <div key={pred.prediction_id} className="bg-white border rounded shadow p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <img src={pred.home_team_logo} alt={pred.home_team} className="w-6 h-6" />
                            <span>{pred.home_team}</span>
                            <span className="font-semibold text-sm">{t('vs')}</span>
                            <span>{pred.away_team}</span>
                            <img src={pred.away_team_logo} alt={pred.away_team} className="w-6 h-6" />
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {(() => {
                            const status = getMatchStatus(pred);
                            return (
                              <span className="flex items-center gap-1">
                                <div
                                  className={
                                    "w-2.5 h-2.5 rounded-full " +
                                    status.dotClass +
                                    (status.animate ? " " + status.animate : "")
                                  }
                                  style={{ display: "inline-block" }}
                                ></div>
                                <span>{status.text}</span>
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-sm mb-1">
                          <strong>{t('prediction')}:</strong>{" "}
                          {editPredictionId === pred.prediction_id ? (
                            <form
                              className="flex items-center gap-2 mt-1"
                              onSubmit={(e) => handleEditSubmit(e, pred.prediction_id)}
                            >
                              <input
                                type="number"
                                min="0"
                                value={editValues.pred_home}
                                onChange={(e) => setEditValues({ ...editValues, pred_home: e.target.value })}
                                className="border rounded px-2 py-1 w-14"
                                required
                              />
                              <span>-</span>
                              <input
                                type="number"
                                min="0"
                                value={editValues.pred_away}
                                onChange={(e) => setEditValues({ ...editValues, pred_away: e.target.value })}
                                className="border rounded px-2 py-1 w-14"
                                required
                              />
                              <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded text-xs">
                                {t('save')}
                              </button>
                            </form>
                          ) : (
                            <span>{pred.pred_home} - {pred.pred_away}</span>
                          )}
                        </div>
                        <div className="text-sm mb-1">
                          <strong>{t('real_score')}:</strong> {pred.score_home ?? "-"} - {pred.score_away ?? "-"}
                        </div>
                        <div className="text-sm mb-2">
                          <strong>{t('points')}:</strong>{" "}
                          <span className={
                            pred.points === 3 ? "text-green-600 font-semibold" :
                            pred.points === 1 ? "text-yellow-500 font-medium" :
                            "text-red-500 font-medium"
                          }>
                            {pred.points ?? "-"}
                          </span>
                        </div>
                        {isEditable(pred.match_date) && editPredictionId !== pred.prediction_id && (
                          <button
                            onClick={() => handleEditClick(pred)}
                            className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                          >
                            {t('edit')}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              ))}
            </div>

            {/* Versión desktop (bloques por ronda, tabla parcial) */}
            <div className="hidden md:block">
              {Object.entries(predictions).map(([round, preds]) => (
                <div key={round} className="mb-6">
                  <div className="flex items-center justify-between border-b-4 border-gray-300 px-1 py-2 mb-2 font-semibold text-sm">
                    <span>
                      {competenciaSeleccionada === "todas" && preds.length > 0 && round !== "En vivo"
                        ? `${preds[0].league_name} - ${round}`
                        : round}
                    </span>
                    <button
                      onClick={() => toggleRoundCollapse(round)}
                      className={`transform transition-transform duration-200 ${
                        collapsedRounds[round] ? "rotate-0" : "rotate-90"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {!collapsedRounds[round] && (
                    <table className="min-w-full bg-white border border-gray-300">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b text-left">Partido</th>
                          <th className="py-2 px-4 border-b text-left">Pronóstico</th>
                          <th className="py-2 px-4 border-b text-left">Marcador real</th>
                          <th className="py-2 px-4 border-b text-left">Puntos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preds.map((pred) => (
                          <tr key={pred.prediction_id}>
                            <td className="py-2 px-4 border-b">
                              <div className="flex items-center gap-2">
                                <img src={pred.home_team_logo} alt={pred.home_team} className="w-6 h-6 object-contain" />
                                <span>{pred.home_team}</span>
                                <span>{t('vs')}</span>
                                <span>{pred.away_team}</span>
                                <img src={pred.away_team_logo} alt={pred.away_team} className="w-6 h-6 object-contain" />
                              </div>
                              <div className="text-sm text-gray-500">
                                {(() => {
                                  const status = getMatchStatus(pred);
                                  return (
                                    <span className="flex items-center gap-1">
                                      <div
                                        className={
                                          "w-2.5 h-2.5 rounded-full " +
                                          status.dotClass +
                                          (status.animate ? " " + status.animate : "")
                                        }
                                        style={{ display: "inline-block" }}
                                      ></div>
                                      <span>{status.text}</span>
                                    </span>
                                  );
                                })()}
                              </div>
                            </td>
                            <td className="py-2 px-4 border-b">
                              {editPredictionId === pred.prediction_id ? (
                                <form
                                  className="flex items-center gap-2"
                                  onSubmit={(e) => handleEditSubmit(e, pred.prediction_id)}
                                >
                                  <input
                                    type="number"
                                    min="0"
                                    value={editValues.pred_home}
                                    onChange={(e) => setEditValues({ ...editValues, pred_home: e.target.value })}
                                    className="border rounded px-2 py-1 w-16"
                                    required
                                  />
                                  <span>-</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editValues.pred_away}
                                    onChange={(e) => setEditValues({ ...editValues, pred_away: e.target.value })}
                                    className="border rounded px-2 py-1 w-16"
                                    required
                                  />
                                  <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded">
                                    {t('save')}
                                  </button>
                                </form>
                              ) : (
                                `${pred.pred_home} - ${pred.pred_away}`
                              )}
                            </td>
                            <td className="py-2 px-4 border-b">
                              {pred.score_home ?? "-"} - {pred.score_away ?? "-"}
                            </td>
                            <td className="py-2 px-4 border-b">
                              <span className={
                                pred.points === 3 ? "text-green-600 font-semibold" :
                                pred.points === 1 ? "text-yellow-500 font-medium" :
                                "text-red-500 font-medium"
                              }>
                                {pred.points ?? "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}

export default UserPredictions;