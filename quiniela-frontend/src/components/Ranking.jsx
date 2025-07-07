import { useEffect, useState } from "react";
import axios from "../utils/axiosConfig";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

const baseUrl = import.meta.env.VITE_API_URL;

const Ranking = () => {
  const { authToken } = useAuth();
  const [rankingData, setRankingData] = useState([]);
  const [sortedData, setSortedData] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: "total_points", direction: "desc" });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        if (authToken) {
          const res = await axios.get(`${baseUrl}/me`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          setUserId(res.data.user_id);
        }

        const response = await axios.get(`${baseUrl}/ranking/`);
        setRounds(response.data.rounds);
        setRankingData(response.data.ranking);
      } catch (error) {
        console.error("Error cargando ranking:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [authToken]);

  useEffect(() => {
    let sorted = [...rankingData];
    if (sortConfig.key === "total_points") {
      sorted.sort((a, b) =>
        sortConfig.direction === "asc"
          ? a.total_points - b.total_points
          : b.total_points - a.total_points
      );
    } else {
      sorted.sort((a, b) =>
        sortConfig.direction === "asc"
          ? (a.rounds[sortConfig.key] ?? 0) - (b.rounds[sortConfig.key] ?? 0)
          : (b.rounds[sortConfig.key] ?? 0) - (a.rounds[sortConfig.key] ?? 0)
      );
    }
    setSortedData(sorted);
  }, [rankingData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

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
                {rounds.map((r) => (
                  <th key={r} className="border border-gray-300 px-2 py-1 text-center">
                    <button
                      onClick={() => handleSort(r)}
                      className="hover:underline text-blue-600"
                    >
                      {r} {sortConfig.key === r ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                    </button>
                  </th>
                ))}
                <th className="border border-gray-300 px-2 py-1 text-center font-bold">
                  <button
                    onClick={() => handleSort("total_points")}
                    className="hover:underline text-blue-600"
                  >
                    Total {sortConfig.key === "total_points" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((user, index) => (
                <tr
                  key={user.user_id}
                  className={
                    authToken && userId === user.user_id
                      ? "bg-green-100 font-semibold"
                      : ""
                  }
                >
                  <td className="border border-gray-300 px-2 py-1 text-center">{index + 1}</td>
                  <td className="border border-gray-300 px-2 py-1">{user.name}</td>
                  {rounds.map((r) => (
                    <td key={r} className="border border-gray-300 px-2 py-1 text-center">
                      {user.rounds[r] ?? 0}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-2 py-1 text-center font-bold">
                    {user.total_points}
                  </td>
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