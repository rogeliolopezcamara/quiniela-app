// src/components/AvailableMatches.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
const baseUrl = import.meta.env.VITE_API_URL;


const AvailableMatches = () => {
  const [matches, setMatches] = useState([]);
  const { authToken, userId } = useAuth();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await axios.get("${baseUrl}/available-matches/", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        setMatches(response.data);
      } catch (error) {
        console.error("Error al obtener partidos disponibles:", error);
      }
    };

    fetchMatches();
  }, [authToken]);

  const handleSubmit = async (match_id, pred_home, pred_away) => {
    try {
      await axios.post(
        "http://${baseUrl}/predictions/",
        {
          match_id,
          pred_home,
          pred_away,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      alert("Pronóstico enviado correctamente");
      setMatches((prevMatches) => prevMatches.filter((m) => m.match_id !== match_id));
    } catch (error) {
      console.error("Error al enviar el pronóstico:", error);
      alert("Hubo un error al enviar el pronóstico");
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 p-6 w-full">
        <h1 className="text-2xl font-bold mb-4">Partidos Disponibles</h1>
        {matches.map((match) => (
          <div key={match.match_id} className="bg-gray-100 p-4 mb-4 rounded">
            <p className="mb-2">
              {match.home_team} vs {match.away_team} —{" "}
              {new Date(match.match_date).toLocaleString("es-MX", {
                dateStyle: "full",
                timeStyle: "short",
              })}
            </p>
            <form
              className="flex items-center gap-2"
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
              />
              <span>-</span>
              <input
                name={`away_${match.match_id}`}
                type="number"
                placeholder="Visita"
                className="border rounded px-2 py-1 w-16"
                required
              />
              <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
                Enviar
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableMatches;
