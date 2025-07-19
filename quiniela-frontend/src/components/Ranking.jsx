import { useEffect, useState, useRef } from "react";
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

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [sortedData]);

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
      <div className="pt-20 px-4 w-full max-w-6xl mx-auto overflow-y-auto h-[calc(100dvh-5rem)]">
        <h1 className="text-2xl font-bold mb-4 text-center">Ranking de Usuarios</h1>
        {loading ? (
          <p className="text-center text-gray-500">Cargando...</p>
        ) : (
          <div className="bg-white rounded-lg shadow-none min-h-[300px] overflow-y-auto">
            <div
              className="overflow-auto scroll-smooth"
              ref={scrollRef}
              style={{ maxWidth: "100%", overflowX: "auto" }}
            >
              <table className="min-w-max table-fixed border border-gray-200 shadow-md rounded-lg text-sm mx-auto">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-sm uppercase">
                    <th
                      className="border border-gray-300 px-2 py-2 w-10 sticky left-0 z-20 bg-white"
                      style={{ boxShadow: "2px 0 0 0 rgba(209,213,219,1)" }}
                    >
                      #
                    </th>
                    <th
                      className="border border-gray-300 px-3 py-2 min-w-[140px] max-w-[200px] overflow-x-auto whitespace-nowrap sticky left-[2.5rem] z-20 bg-white"
                      style={{ boxShadow: "2px 0 0 0 rgba(209,213,219,1)" }}
                    >
                      Nombre
                    </th>
                    {rounds.map((r) => (
                      <th key={r} className="border border-gray-300 px-2 py-2 text-center whitespace-nowrap w-16">
                        <button
                          onClick={() => handleSort(r)}
                          className="hover:underline text-blue-600"
                        >
                          {r} {sortConfig.key === r ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                        </button>
                      </th>
                    ))}
                    <th
                      className="border border-gray-300 px-3 py-2 text-center font-bold bg-white w-16"
                    >
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
                      className={`border-t border-gray-200 hover:bg-gray-50 ${
                        index === 0 ? "bg-yellow-100 font-semibold" :
                        index === 1 ? "bg-gray-200 font-semibold" :
                        index === 2 ? "bg-orange-100 font-semibold" :
                        authToken && userId === user.user_id ? "bg-green-100 font-semibold" : ""
                      }`}
                    >
                      <td
                        className="border border-gray-300 px-2 py-2 w-10 sticky left-0 z-20 bg-inherit text-center"
                        style={{ boxShadow: "2px 0 0 0 rgba(209,213,219,1)" }}
                      >
                        {index === 0 ? (
                          <span title="Primer lugar">🥇</span>
                        ) : index === 1 ? (
                          <span title="Segundo lugar">🥈</span>
                        ) : index === 2 ? (
                          <span title="Tercer lugar">🥉</span>
                        ) : (
                          index + 1
                        )}
                      </td>
                      <td
                        className="border border-gray-300 px-3 py-2 min-w-[140px] max-w-[200px] overflow-x-auto whitespace-nowrap sticky left-[2.5rem] z-20 bg-inherit"
                        style={{ boxShadow: "2px 0 0 0 rgba(209,213,219,1)" }}
                      >
                        {user.name}
                      </td>
                      {rounds.map((r) => (
                        <td key={r} className="border border-gray-300 px-2 py-2 text-center w-16">
                          {user.rounds[r] ?? 0}
                        </td>
                      ))}
                      <td
                        className="border border-gray-300 px-3 py-2 text-center font-bold bg-inherit w-16"
                      >
                        {user.total_points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Ranking;