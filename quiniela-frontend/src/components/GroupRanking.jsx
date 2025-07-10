import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import axios from "../utils/axiosConfig";
import Sidebar from "./Sidebar";

const baseUrl = import.meta.env.VITE_API_URL;

function GroupRanking() {
  const { authToken } = useAuth();
  const { group_id } = useParams();
  const [ranking, setRanking] = useState([]);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const res = await axios.get(`${baseUrl}/groups/${group_id}/ranking`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        setGroupName(res.data.group_name);
        setRanking(res.data.ranking);
      } catch (err) {
        console.error("Error al obtener ranking del grupo", err);
      }
    };

    if (authToken) {
      fetchRanking();
    }
  }, [authToken, group_id]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="mt-20 w-full px-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          🏆 Ranking del grupo: {groupName}
        </h1>

        {ranking.length === 0 ? (
          <p className="text-center text-gray-600">Aún no hay datos de ranking.</p>
        ) : (
          <table className="w-full table-auto border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Posición</th>
                <th className="px-4 py-2 border">Nombre</th>
                <th className="px-4 py-2 border">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((user, idx) => (
                <tr key={user.user_id} className="text-center">
                  <td className="border px-4 py-2">{idx + 1}</td>
                  <td className="border px-4 py-2">{user.name}</td>
                  <td className="border px-4 py-2">{user.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default GroupRanking;