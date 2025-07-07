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

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Obtener userId solo si hay token
        let fetchedUserId = null;
        if (authToken) {
          const res = await axios.get(`${baseUrl}/me`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          fetchedUserId = res.data.user_id;
          setUserId(fetchedUserId);
        }

        // Obtener el ranking
        const response = await axios.get(`${baseUrl}/ranking/`);
        setRankingData(response.data);
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
      <div className="pt-20 px-4 w-full max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Ranking de Usuarios</h1>
        {loading ? (
          <p className="text-center text-gray-500">Cargando...</p>
        ) : (
          <table className="w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">#</th>
                <th className="border border-gray-300 px-4 py-2">Nombre</th>
                <th className="border border-gray-300 px-4 py-2">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {rankingData.map((user, index) => (
                <tr
                  key={user.user_id}
                  className={
                    authToken && userId === user.user_id
                      ? "bg-green-100 font-semibold"
                      : ""
                  }
                >
                  <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-2">{user.name}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{user.total_points}</td>
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