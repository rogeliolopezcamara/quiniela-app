import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";

const Ranking = () => {
  const [rankingData, setRankingData] = useState([]);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await axios.get("${baseUrl}/ranking/");
        setRankingData(response.data);
      } catch (error) {
        console.error("Error al obtener el ranking:", error);
      }
    };

    fetchRanking();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 p-6 w-full max-w-4xl">
        <h1 className="text-2xl font-bold mb-4">Ranking de Usuarios</h1>
        <table className="w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">#</th>
              <th className="border border-gray-300 px-4 py-2">Nombre</th>
              <th className="border border-gray-300 px-4 py-2">Correo</th>
              <th className="border border-gray-300 px-4 py-2">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {rankingData.map((user, index) => (
              <tr key={user.user_id}>
                <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td>
                <td className="border border-gray-300 px-4 py-2">{user.name}</td>
                <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{user.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Ranking;