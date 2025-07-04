import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

const baseUrl = import.meta.env.VITE_API_URL;

const Ranking = () => {
  const { authToken, userId: contextUserId } = useAuth();
  const [rankingData, setRankingData] = useState([]);
  const [userId, setUserId] = useState(contextUserId);

  useEffect(() => {
    const fetchUserIdIfNeeded = async () => {
      if (!contextUserId && authToken) {
        try {
          const response = await axios.get(`${baseUrl}/me`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          setUserId(response.data.user_id);
        } catch (error) {
          console.error("Error al obtener el usuario:", error);
        }
      }
    };

    fetchUserIdIfNeeded();
  }, [authToken, contextUserId]);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await axios.get(`${baseUrl}/ranking/`);
        setRankingData(response.data);
      } catch (error) {
        console.error("Error al obtener el ranking:", error);
      }
    };

    fetchRanking();
  }, []);

  return (
    <>
      <Sidebar />
      <div className="pt-20 px-4 w-full max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Ranking de Usuarios</h1>
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
      </div>
    </>
  );
};

export default Ranking;