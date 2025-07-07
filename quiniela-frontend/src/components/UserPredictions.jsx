// src/components/UserPredictions.jsx
import { useEffect, useState } from "react";
import axios from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

const baseUrl = import.meta.env.VITE_API_URL;

const UserPredictions = () => {
  const { authToken } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [editPredictionId, setEditPredictionId] = useState(null);
  const [editValues, setEditValues] = useState({ pred_home: '', pred_away: '' });

  useEffect(() => {
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
      fetchPredictions();
    }
  }, [authToken]);

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

  const normalizeISOString = (s) => s.endsWith("Z") ? s : s + "Z";

  const isEditable = (match_date) => {
    const localMatchDate = new Date(normalizeISOString(match_date));
    const now = new Date(); // local time
    return localMatchDate > now;
  };

  const formatDate = (isoString) => {
    const s = normalizeISOString(isoString);
    const date = new Date(s);
    return date.toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="flex">
    <Sidebar />
    <div className="p-6 w-full max-w-5xl mx-auto mt-20">
      <h2 className="text-2xl font-bold mb-4 text-center">Tus pronósticos</h2>
      {predictions.length === 0 ? (
        <p className="text-center">No tienes pronósticos aún.</p>
      ) : (
        <>
          <p className="text-sm text-gray-500 text-center mb-4">
            * Las fechas y horas se muestran en tu horario local.
          </p>

          {/* Versión mobile (tarjetas) */}
          <div className="flex flex-col gap-4 md:hidden">
            {predictions.map((pred) => (
              <div key={pred.prediction_id} className="bg-white border rounded shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img src={pred.home_team_logo} alt={pred.home_team} className="w-6 h-6" />
                    <span>{pred.home_team}</span>
                    <span className="font-semibold text-sm">vs</span>
                    <span>{pred.away_team}</span>
                    <img src={pred.away_team_logo} alt={pred.away_team} className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-2">{formatDate(pred.match_date)}</div>
                <div className="text-sm mb-1">
                  <strong>Pronóstico:</strong>{" "}
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
                        Guardar
                      </button>
                    </form>
                  ) : (
                    <span>{pred.pred_home} - {pred.pred_away}</span>
                  )}
                </div>
                <div className="text-sm mb-1">
                  <strong>Marcador real:</strong> {pred.score_home ?? "-"} - {pred.score_away ?? "-"}
                </div>
                <div className="text-sm mb-2">
                  <strong>Puntos:</strong> {pred.points ?? "-"}
                </div>
                {isEditable(pred.match_date) && editPredictionId !== pred.prediction_id && (
                  <button
                    onClick={() => handleEditClick(pred)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Editar
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Versión desktop (tabla) */}
          <table className="hidden md:table min-w-full bg-white border border-gray-300">
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
                      <img src={pred.home_team_logo} alt={pred.home_team} className="w-6 h-6 object-contain" />
                      <span>{pred.home_team}</span>
                      <span>vs</span>
                      <span>{pred.away_team}</span>
                      <img src={pred.away_team_logo} alt={pred.away_team} className="w-6 h-6 object-contain" />
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
        </>
      )}
    </div>
  </div>
  );
};

export default UserPredictions;