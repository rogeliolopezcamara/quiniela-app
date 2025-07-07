import { useEffect, useState } from "react";
import axios from "../utils/axiosConfig";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

const baseUrl = import.meta.env.VITE_API_URL;

const Ranking = () => {
  const { authToken } = useAuth();
  const [rankingData, setRankingData] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rounds, setRounds] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        let fetchedUserId = null;
        if (authToken) {
          const res = await axios.get(`${baseUrl}/me`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          fetchedUserId = res.data.user_id;
          setUserId(fetchedUserId);
        }

        const response = await axios.get(`${baseUrl}/ranking/`);
        const data = response.data;

        // Obtener todos los rounds únicos desde los datos
        const allRounds = new Set();
        data.forEach(user => {
          Object.keys(user.round_points || {}).forEach(round => allRounds.add(round));
        });
        const sortedRounds = Array.from(allRounds).sort();

        setRounds(sortedRounds);
        setRankingData(data);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [authToken]);

  return (
    <>
      <Sidebar />
      <div className="pt-20 px-4 w-full max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Ranking de Usuarios</h1>
        {loading ? (
          <p className="text-center text-gray-500">Cargando...</p>
        ) : (
          <table className="w-full table-auto border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1">#</th>
                <th className="border border-gray-300 px-2 py-1">Nombre</th>
                {rounds.map(round => (
                  <th key={round} className="border border-gray-300 px-2 py-1">{round}</th>
                ))}
                <th className="border border-gray-300 px-2 py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {rankingData.map((user, index) => (
                <tr
                  key={user.user_id}
                  className={authToken && userId === user.user_id ? "bg-green-100 font-semibold" : ""}
                >
                  <td className="border border-gray-300 px-2 py-1 text-center">{index + 1}</td>
                  <td className="border border-gray-300 px-2 py-1">{user.name}</td>
                  {rounds.map(round => (
                    <td key={round} className="border border-gray-300 px-2 py-1 text-center">
                      {user.round_points?.[round] ?? 0}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-2 py-1 text-center">{user.total_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default Ranking;
