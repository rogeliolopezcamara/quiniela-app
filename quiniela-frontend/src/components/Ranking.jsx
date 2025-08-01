import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "../utils/axiosConfig";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { useQuery } from '@tanstack/react-query';

const baseUrl = import.meta.env.VITE_API_URL;

const Ranking = () => {
  const [searchParams] = useSearchParams();
  const initialCompetenciaId = searchParams.get("competencia_id");

  const { authToken } = useAuth();
  const [sortedData, setSortedData] = useState([]);
  const [competenciaSeleccionada, setCompetenciaSeleccionada] = useState(() => {
    const stored = localStorage.getItem("rankingCompetencia");
    return stored ? parseInt(stored) : null;
  });
  const [sortConfig, setSortConfig] = useState({ key: "total_points", direction: "desc" });

  const [selectedRonda, setSelectedRonda] = useState("");

  const {
    data: userInfo,
    isLoading: loadingUser,
    error: userError,
  } = useQuery({
    queryKey: ['userInfo'],
    queryFn: async () => {
      const res = await axios.get(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return res.data;
    },
    enabled: !!authToken,
    staleTime: 1000 * 60,
  });

  const {
    data: competencias = [],
    isLoading: loadingCompetencias,
    error: competenciasError,
  } = useQuery({
    queryKey: ['userCompetitions'],
    queryFn: async () => {
      const res = await axios.get(`${baseUrl}/my-competitions-with-stats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return res.data;
    },
    enabled: !!authToken,
    staleTime: 1000 * 60,
  });

useEffect(() => {
  if (competencias.length > 0) {
    if (initialCompetenciaId) {
      const match = competencias.find(c => c.id === parseInt(initialCompetenciaId));
      if (match) {
        setCompetenciaSeleccionada(match.id);
        localStorage.setItem("rankingCompetencia", match.id.toString());
        return;
      }
    }
    if (competenciaSeleccionada === null) {
      setCompetenciaSeleccionada(competencias[0].id);
    }
  }
}, [competencias, initialCompetenciaId, competenciaSeleccionada]);

  useEffect(() => {
    if (competenciaSeleccionada !== null) {
      localStorage.setItem("rankingCompetencia", competenciaSeleccionada.toString());
    }
  }, [competenciaSeleccionada]);

  const {
    data: rankingInfo,
    isLoading: loadingRanking,
    error: rankingError,
  } = useQuery({
    queryKey: ['ranking', competenciaSeleccionada],
    queryFn: async () => {
      const res = await axios.get(`${baseUrl}/ranking/?competition_id=${competenciaSeleccionada}`);
      return res.data;
    },
    enabled: !!competenciaSeleccionada,
    refetchInterval: 10000,
  });


  const {
    data: matrixData,
  } = useQuery({
    queryKey: ['roundMatrixData', competenciaSeleccionada, selectedRonda],
    queryFn: async () => {
      const res = await axios.get(`${baseUrl}/round-matrix/?competition_id=${competenciaSeleccionada}&league_round=${selectedRonda}`);
      return res.data;
    },
    enabled: !!competenciaSeleccionada && !!selectedRonda,
  });

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
    }
  }, [sortedData]);

  useEffect(() => {
    let sorted = [...(rankingInfo?.ranking || [])];
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
  }, [rankingInfo, sortConfig]);

  // Inicializar selectedRonda con la última ronda disponible de rankingInfo si no está establecida
  useEffect(() => {
    if (!selectedRonda && rankingInfo?.rounds?.length > 0) {
      setSelectedRonda(rankingInfo.rounds[rankingInfo.rounds.length - 1]);
    }
  }, [rankingInfo, selectedRonda]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  if (loadingUser || loadingCompetencias) {
    return (
      <>
        <Sidebar />
        <div className="pt-10 pb-24 px-4 w-full max-w-6xl mx-auto text-center">
          <p className="text-gray-500">Cargando usuario y competencias...</p>
        </div>
      </>
    );
  }

  if (userError || competenciasError) {
    return (
      <>
        <Sidebar />
        <div className="pt-10 pb-24 px-4 w-full max-w-6xl mx-auto text-center">
          <p className="text-red-500">Error cargando usuario o competencias.</p>
        </div>
      </>
    );
  }

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

        {loadingRanking ? (
          <p className="text-center text-gray-500">Cargando...</p>
        ) : rankingError ? (
          <p className="text-center text-red-500">Error cargando ranking.</p>
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
                    {(rankingInfo?.rounds || []).map((r) => (
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
                          authToken && userInfo?.user_id === user.user_id ? "bg-green-100 font-semibold" : ""
                        }`}
                      >
                        <td className={`border-r border-gray-300 sticky-cell px-2 py-2 min-w-[2.5rem] sticky left-0 z-30 text-center relative ${
                          pos === 1 ? "bg-yellow-100" :
                          pos === 2 ? "bg-gray-200" :
                          pos === 3 ? "bg-orange-100" :
                          authToken && userInfo?.user_id === user.user_id ? "bg-green-100" : "bg-white"
                        }`}>
                          {pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : pos}
                        </td>
                        <td className={`border-r border-gray-300 sticky-cell px-3 py-2 w-[200px] whitespace-nowrap overflow-hidden text-ellipsis sticky left-[2.5rem] z-30 relative ${
                          pos === 1 ? "bg-yellow-100" :
                          pos === 2 ? "bg-gray-200" :
                          pos === 3 ? "bg-orange-100" :
                          authToken && userInfo?.user_id === user.user_id ? "bg-green-100" : "bg-white"
                        }`}>
                          {user.name}
                        </td>
                        {(rankingInfo?.rounds || []).map((r) => (
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

        {rankingInfo?.rounds?.length > 0 && (
          <div className="mt-8">
            <label className="block font-semibold mb-1 text-center">Selecciona una ronda:</label>
            <select
              value={selectedRonda}
              onChange={(e) => setSelectedRonda(e.target.value)}
              className="w-full max-w-xs mx-auto border rounded px-3 py-2 text-sm block"
            >
              {rankingInfo.rounds.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}

        {selectedRonda && matrixData?.matches?.length > 0 && (
          <div className="mt-6 overflow-x-auto text-sm">
            <table className="table-auto border border-gray-300 w-full">
              <thead>
                <tr>
                  <th className="border px-2 py-1 bg-gray-100 text-left">Usuario</th>
                  {matrixData.matches.map((match) => (
                    <th key={match.id} className="border px-2 py-1 text-center">
                      <div>{match.home_team} vs {match.away_team}</div>
                      <div className="text-xs text-gray-500">{match.status_short === "NS" ? "No iniciado" : match.status_short === "FT" ? `${match.score_home}-${match.score_away}` : "En vivo"}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData.map((user) => (
                  <tr key={user.user_id}>
                    <td className="border px-2 py-1">{user.name}</td>
                    {matrixData.matches.map((match) => {
                      const pred = matrixData.predictions.find(p => p.user_id === user.user_id && p.match_id === match.id);
                      const points = pred?.points ?? null;
                      let color = "bg-gray-200";
                      if (points === 3) color = "bg-green-500";
                      else if (points === 1) color = "bg-yellow-400";
                      else if (points === 0) color = "bg-red-500";
                      return (
                        <td key={match.id} className="border px-2 py-1 text-center">
                          {points != null ? (
                            <div className={`w-4 h-4 mx-auto rounded-full ${color}`}></div>
                          ) : (
                            "-"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Ranking;