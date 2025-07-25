import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "../utils/axiosConfig";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

const baseUrl = import.meta.env.VITE_API_URL;

const Ranking = () => {
  const [searchParams] = useSearchParams();
  const initialCompetenciaId = searchParams.get("competencia_id");

  const { authToken } = useAuth();
  const [rankingData, setRankingData] = useState([]);
  const [sortedData, setSortedData] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: "total_points", direction: "desc" });
  const [competencias, setCompetencias] = useState([]);
  const [competenciaSeleccionada, setCompetenciaSeleccionada] = useState(null);

  useEffect(() => {
    const fetchUsuarioYCompetencias = async () => {
      try {
        if (authToken) {
          const res = await axios.get(`${baseUrl}/me`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          setUserId(res.data.user_id);

          const comps = await axios.get(`${baseUrl}/my-competitions-with-stats`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });

          setCompetencias(comps.data);
          if (comps.data.length > 0) {
            const match = comps.data.find(c => c.id === parseInt(initialCompetenciaId));
            setCompetenciaSeleccionada(match ? match.id : comps.data[0].id);
          }
        }
      } catch (error) {
        console.error("Error cargando usuario o competencias:", error);
      }
    };

    fetchUsuarioYCompetencias();
  }, [authToken]);

  useEffect(() => {
    const fetchRanking = async () => {
      if (!competenciaSeleccionada) return;

      setLoading(true);
      try {
        const response = await axios.get(`${baseUrl}/ranking/?competition_id=${competenciaSeleccionada}`);
        setRounds(response.data.rounds);
        setRankingData(response.data.ranking);
      } catch (error) {
        console.error("Error cargando ranking:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [competenciaSeleccionada]);

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
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
      <style>
        {`
          .sticky-cell::after {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            width: 1px;
            height: 100%;
            background-color: #D1D5DB; /* Tailwind gray-300 */
            z-index: 30;
            pointer-events: none;
          }
        `}
      </style>
      <Sidebar />
      <div className="pt-10 pb-24 px-4 w-full max-w-6xl mx-auto overflow-y-auto h-[calc(100dvh-5rem)]">
        <h1 className="text-2xl font-bold mb-4 text-center">Ranking de Usuarios</h1>

        <div className="mb-6 max-w-xs mx-auto">
          <label className="block font-semibold mb-1 text-center">Selecciona una competencia:</label>
          <select
            value={competenciaSeleccionada || ""}
            onChange={(e) => setCompetenciaSeleccionada(parseInt(e.target.value))}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            {competencias.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Cargando...</p>
        ) : (
          <div className="min-h-[300px] overflow-y-auto">
            <div
              className="overflow-auto scroll-smooth"
              ref={scrollRef}
              style={{ maxWidth: "100%", overflowX: "auto" }}
            >
              <table className="min-w-max table-fixed border border-gray-200 text-sm mx-auto">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-sm uppercase">
                    <th className="border-r border-gray-300 sticky-cell px-2 py-2 min-w-[2.5rem] sticky left-0 z-30 bg-white text-center relative">#</th>
                    <th className="border-r border-gray-300 sticky-cell px-3 py-2 w-[200px] whitespace-nowrap overflow-hidden text-ellipsis sticky left-[2.5rem] z-30 bg-white relative">Nombre</th>
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
                    <th className="border border-gray-300 px-3 py-2 text-center font-bold bg-white w-16">
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
                  {sortedData.map((user) => {
                    const pos = user.position;
                    return (
                      <tr
                        key={user.user_id}
                        className={`border-t border-gray-200 hover:bg-gray-50 ${
                          pos === 1 ? "bg-yellow-100 font-semibold" :
                          pos === 2 ? "bg-gray-200 font-semibold" :
                          pos === 3 ? "bg-orange-100 font-semibold" :
                          authToken && userId === user.user_id ? "bg-green-100 font-semibold" : ""
                        }`}
                      >
                        <td className={`border-r border-gray-300 sticky-cell px-2 py-2 min-w-[2.5rem] sticky left-0 z-30 text-center relative ${
                          pos === 1 ? "bg-yellow-100" :
                          pos === 2 ? "bg-gray-200" :
                          pos === 3 ? "bg-orange-100" :
                          authToken && userId === user.user_id ? "bg-green-100" : "bg-white"
                        }`}>
                          {pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : pos}
                        </td>
                        <td className={`border-r border-gray-300 sticky-cell px-3 py-2 w-[200px] whitespace-nowrap overflow-hidden text-ellipsis sticky left-[2.5rem] z-30 relative ${
                          pos === 1 ? "bg-yellow-100" :
                          pos === 2 ? "bg-gray-200" :
                          pos === 3 ? "bg-orange-100" :
                          authToken && userId === user.user_id ? "bg-green-100" : "bg-white"
                        }`}>
                          {user.name}
                        </td>
                        {rounds.map((r) => (
                          <td key={r} className="border border-gray-300 px-2 py-2 text-center w-16">
                            {user.rounds[r] ?? 0}
                          </td>
                        ))}
                        <td className="border border-gray-300 px-3 py-2 text-center font-bold bg-inherit w-16">
                          {user.total_points}
                        </td>
                      </tr>
                    );
                  })}
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