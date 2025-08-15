import { useEffect, useState, useRef, useMemo } from "react";
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
    queryKey: ['ranking', competenciaSeleccionada, (competencias || []).map(c => c.id).join(',')],
    queryFn: async () => {
      try {
        const res = await axios.get(`${baseUrl}/ranking/?competition_id=${competenciaSeleccionada}`);
        return res.data;
      } catch (err) {
        if (err?.response?.status === 403) {
          // Fallback a una competencia válida si la actual no es accesible
          const fallback = (competencias && competencias.length > 0) ? competencias[0].id : null;
          if (fallback && competenciaSeleccionada !== fallback) {
            setCompetenciaSeleccionada(fallback);
            localStorage.setItem("rankingCompetencia", String(fallback));
          }
          return { ranking: [], rounds: [] };
        }
        throw err;
      }
    },
    enabled: !!competenciaSeleccionada && (competencias && competencias.length > 0),
    refetchInterval: 10000,
  });
  useEffect(() => {
    if (!competencias || competencias.length === 0) return;
    if (
      competenciaSeleccionada === null ||
      !competencias.some(c => c.id === competenciaSeleccionada)
    ) {
      const fallback = competencias[0].id;
      setCompetenciaSeleccionada(fallback);
      localStorage.setItem("rankingCompetencia", String(fallback));
    }
  }, [competencias, competenciaSeleccionada]);

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

  useEffect(() => {
    if (!selectedRonda && rankingInfo?.rounds?.length > 0) {
      setSelectedRonda(rankingInfo.rounds[rankingInfo.rounds.length - 1]);
    }
  }, [rankingInfo, selectedRonda]);

  // Nuevo useQuery para round-matrix
  const {
    data: roundMatrix,
    isLoading: loadingMatrix,
    error: matrixError,
  } = useQuery({
    queryKey: ['roundMatrix', competenciaSeleccionada, selectedRonda],
    queryFn: async () => {
      const res = await axios.get(`${baseUrl}/round-matrix/?competition_id=${competenciaSeleccionada}&league_round=${selectedRonda}`);
      return res.data;
    },
    enabled: !!competenciaSeleccionada && !!selectedRonda,
  });

  const normalizeISOString = (s) => (typeof s === "string" && s.endsWith("Z")) ? s : `${s}Z`;
  const formatDateTimeLocal = (isoString) => {
    try {
      const d = new Date(normalizeISOString(isoString));
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    } catch {
      return isoString;
    }
  };
  const formatDateTimeNoYear = (isoString) => {
    try {
      const d = new Date(normalizeISOString(isoString));
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${dd}/${mm} ${hh}:${min}`;
    } catch {
      return isoString;
    }
  };

  const matchesSorted = useMemo(() => {
    if (!roundMatrix?.matches) return [];
    return [...roundMatrix.matches].sort((a, b) => {
      const da = new Date(normalizeISOString(a.match_date)).getTime();
      const db = new Date(normalizeISOString(b.match_date)).getTime();
      return da - db;
    });
  }, [roundMatrix]);

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
          <>
            <div className="mt-8 max-w-xs mx-auto">
              <label className="block font-semibold mb-1 text-center">Selecciona una ronda:</label>
              <select
                value={selectedRonda}
                onChange={(e) => setSelectedRonda(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {rankingInfo.rounds.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Tabla tipo matriz de usuarios vs partidos */}
            {!loadingMatrix && roundMatrix?.matches?.length > 0 && (
              <div className="mt-6 min-h-[300px] overflow-y-auto">
                <div className="overflow-auto scroll-smooth" style={{ maxWidth: "100%", overflowX: "auto" }}>
                  <table className="min-w-max table-fixed border border-gray-300 text-sm mx-auto">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1 bg-gray-100 text-left sticky-cell sticky left-0 z-30 bg-white">Usuario</th>
                        {matchesSorted.map((match) => (
                          <th key={match.id} className="border px-2 py-1 text-center whitespace-nowrap align-bottom">
                            <div className="flex items-center justify-center gap-1">
                              <img src={match.home_team_logo} alt={match.home_team} className="w-5 h-5 object-contain" />
                              <span className="text-xs text-gray-500">vs</span>
                              <img src={match.away_team_logo} alt={match.away_team} className="w-5 h-5 object-contain" />
                            </div>
                            <div className="text-[10px] text-gray-600 mt-1">
                              {match.status_short === "NS"
                                ? formatDateTimeNoYear(match.match_date)
                                : `${match.score_home ?? ""}${(match.score_home != null && match.score_away != null) ? "-" : ""}${match.score_away ?? ""}`}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedData.map((user) => (
                        <tr key={user.user_id} className={(authToken && userInfo?.user_id === user.user_id) ? "bg-green-100 font-semibold" : ""}>
                          <td className={`border px-2 py-1 sticky-cell sticky left-0 z-20 ${
                            (authToken && userInfo?.user_id === user.user_id) ? "bg-green-100 font-semibold" : "bg-white"
                          }`}>{user.name}</td>
                          {matchesSorted.map((match) => {
                            const pred = roundMatrix.predictions?.find(p => p.user_id === user.user_id && p.match_id === match.id);
                            const points = pred?.points ?? null;
                            let color = "bg-gray-300"; // default
                            if (match.status_short === "NS") {
                              color = "bg-gray-300"; // not started -> always gray
                            } else {
                              if (points === 3) color = "bg-green-500";
                              else if (points === 1) color = "bg-yellow-400";
                              else if (points === 0) color = "bg-red-500";
                              else color = "bg-gray-300"; // started but sin predicción -> keep "-" below
                            }
                            return (
                              <td key={match.id} className="border px-2 py-1 text-center">
                                {(match.status_short === "NS") ? (
                                  <div className={`w-4 h-4 mx-auto rounded-full ${color}`} title="No iniciado"></div>
                                ) : (
                                  points != null ? (
                                    <div className={`w-4 h-4 mx-auto rounded-full ${color}`}></div>
                                  ) : (
                                    "-"
                                  )
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Ranking;