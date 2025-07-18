// src/components/PredictionsCenter.jsx
import { useEffect, useState } from "react";
import axios from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

const baseUrl = import.meta.env.VITE_API_URL;

const PredictionsCenter = () => {
  const { authToken } = useAuth();
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [editPredictionId, setEditPredictionId] = useState(null);
  const [editValues, setEditValues] = useState({ pred_home: '', pred_away: '' });

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await axios.get(`${baseUrl}/available-matches/`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const now = new Date();
        const in8Days = new Date();
        in8Days.setDate(now.getDate() + 8);

        const filtered = response.data.filter((match) => {
          const matchDate = new Date(match.match_date);
          return matchDate <= in8Days;
        });

        setMatches(filtered);
      } catch (error) {
        console.error("Error al obtener partidos disponibles:", error);
      }
    };

    const fetchPredictions = async () => {
      try {
        const response = await axios.get(`${baseUrl}/my-predictions/`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const sorted = [...response.data].sort(
          (a, b) => new Date(a.match_date) - new Date(b.match_date)
        );
        setPredictions(sorted);
      } catch (error) {
        console.error("Error al obtener pronósticos:", error);
      }
    };

    if (authToken) {
      fetchMatches();
      fetchPredictions();
    }
  }, [authToken]);

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
      setMatches((prev) => prev.filter((m) => m.match_id !== match_id));
    } catch (error) {
      console.error("Error al enviar el pronóstico:", error);
      alert("Hubo un error al enviar el pronóstico");
    }
  };

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
      const updated = predictions.map((p) =>
        p.prediction_id === prediction_id ? { ...p, ...editValues } : p
      );
      setPredictions(updated);
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

  const isEditable = (match_date) => {
    const localMatchDate = new Date(normalizeISOString(match_date));
    const now = new Date();
    return localMatchDate > now;
  };

  const groupedMatches = matches.reduce((acc, match) => {
    const round = match.league_round || "Otros";
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {});

  return (
    <div className="flex">
      <Sidebar />
      <div className="p-6 w-full max-w-5xl mx-auto mt-20">
        <h1 className="text-3xl font-bold mb-8 text-center">Pronósticos</h1>

        {/* Partidos disponibles */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">🎯 Ingresa tus pronósticos</h2>
          {Object.entries(groupedMatches).map(([round, roundMatches]) => (
            <div key={round} className="mb-10">
              <h3 className="text-lg font-semibold mb-4 text-purple-700">{round}</h3>
              {roundMatches.map((match) => (
                <div key={match.match_id} className="bg-gray-100 p-4 mb-6 rounded shadow">
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

        {/* Pronósticos existentes */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">📋 Tus pronósticos</h2>
          {predictions.length === 0 ? (
            <p className="text-center">No tienes pronósticos aún.</p>
          ) : (
            <table className="w-full bg-white border border-gray-300">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Partido</th>
                  <th className="py-2 px-4 border-b">Pronóstico</th>
                  <th className="py-2 px-4 border-b">Marcador real</th>
                  <th className="py-2 px-4 border-b">Puntos</th>
                  <th className="py-2 px-4 border-b">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((pred) => (
                  <tr key={pred.prediction_id}>
                    <td className="py-2 px-4 border-b">
                      <div className="flex items-center gap-2">
                        <img src={pred.home_team_logo} alt={pred.home_team} className="w-6 h-6" />
                        <span>{pred.home_team}</span>
                        <span>vs</span>
                        <span>{pred.away_team}</span>
                        <img src={pred.away_team_logo} alt={pred.away_team} className="w-6 h-6" />
                      </div>
                      <div className="text-sm text-gray-500">{formatDate(pred.match_date)}</div>
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
                          <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded">
                            Guardar
                          </button>
                        </form>
                      ) : (
                        `${pred.pred_home} - ${pred.pred_away}`
                      )}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {pred.score_home ?? "-"} - {pred.score_away ?? "-"}
                    </td>
                    <td className="py-2 px-4 border-b">{pred.points ?? "-"}</td>
                    <td className="py-2 px-4 border-b">
                      {isEditable(pred.match_date) && editPredictionId !== pred.prediction_id && (
                        <button
                          onClick={() => handleEditClick(pred)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded"
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionsCenter;