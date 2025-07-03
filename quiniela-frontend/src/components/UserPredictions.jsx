import { useEffect, useState } from "react";
import axios from "axios";
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

  const isEditable = (match_date) => new Date(match_date) > new Date();

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="p-6 w-full max-w-5xl mx-auto mt-20">
        <h2 className="text-2xl font-bold mb-4 text-center">Tus pronósticos</h2>
        {predictions.length === 0 ? (
          <p className="text-center">No tienes pronósticos aún.</p>
        ) : (
          <table className="min-w-full bg-white border border-gray-300">
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
                    <div>
                      {pred.home_team} vs {pred.away_team}
                      <div className="text-sm text-gray-500">
                        {formatDate(pred.match_date)}
                      </div>
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
                          value={editValues.pred_home}
                          onChange={(e) => setEditValues({ ...editValues, pred_home: e.target.value })}
                          className="border rounded px-2 py-1 w-16"
                          required
                        />
                        <span>-</span>
                        <input
                          type="number"
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
        )}
      </div>
    </div>
  );
};

export default UserPredictions;