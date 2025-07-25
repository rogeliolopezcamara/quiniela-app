// src/components/Dashboard.jsx
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useEffect, useState } from "react";
import axios from "../utils/axiosConfig";
import CrearCompetencia from "../pages/CrearCompetencia";
import UnirseCompetencia from "../pages/UnirseCompetencia";

const baseUrl = import.meta.env.VITE_API_URL;

function Dashboard() {
  const { authToken, logout } = useAuth();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [userCompetitions, setUserCompetitions] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const reloadCompetitions = async () => {
    try {
      const response = await axios.get(`${baseUrl}/my-competitions-with-stats`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setUserCompetitions(response.data);
    } catch (error) {
      console.error("Error al obtener competencias:", error);
    }
  };

  const handleDeleteCompetition = async (competitionId) => {
    const confirmed = window.confirm("¿Estás seguro de que deseas eliminar esta competencia?");
    if (!confirmed) return;

    try {
      await axios.delete(`${baseUrl}/competitions/${competitionId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setUserCompetitions((prev) => prev.filter((c) => c.id !== competitionId));
      alert("Competencia eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar competencia:", error);
      alert("Hubo un error al eliminar la competencia");
    }
  };

  const handleCloseCreate = () => {
    setShowCreateModal(false);
    reloadCompetitions();
  };

  const handleCloseJoin = () => {
    setShowJoinModal(false);
    reloadCompetitions();
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${baseUrl}/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        setUserInfo(response.data);
      } catch (error) {
        console.error("Error al obtener perfil:", error);
      }
    };

    if (authToken) {
      fetchProfile();
      reloadCompetitions();
    }
  }, [authToken, reloadTrigger]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="mt-4 mb-24 w-full text-center px-4 md:mt-20">
        <h1 className="text-3xl font-bold mb-4">
          Bienvenido{userInfo ? `, ${userInfo.name}` : ""}
        </h1>

        {userInfo && (
          <div className="mb-6 space-y-2">
            <p>
              Email: <span className="font-semibold">{userInfo.email}</span>
            </p>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-center gap-4 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold py-2 px-6 rounded-lg shadow"
          >
            ➕ Crear nueva competencia
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-semibold py-2 px-6 rounded-lg shadow"
          >
            🔗 Unirse a competencia
          </button>
        </div>

        <div className="mt-10 text-left max-w-xl mx-auto">
          <h2 className="text-xl font-semibold mb-3">🏆 Tus competencias</h2>
          {userCompetitions.length === 0 ? (
            <p className="text-gray-600">Aún no perteneces a ninguna competencia.</p>
          ) : (
            <ul className="space-y-3">
              {userCompetitions.map((comp) => (
                <li key={comp.id} className="border p-4 rounded-lg shadow-md bg-white">
                  <div className="flex items-center gap-4 mb-4">
                    {comp.leagues.length > 0 && comp.leagues[0].league_logo && (
                      <img
                        src={comp.leagues[0].league_logo}
                        alt="logo"
                        className="w-12 h-12 object-contain"
                      />
                    )}
                    <h3 className="text-xl font-bold">{comp.leagues.length > 0 ? comp.leagues[0].league_name : "Competencia"}</h3>
                  </div>
                  <p className="text-lg font-semibold mb-1">{comp.name}</p>
                  {!comp.is_public && (
                    <p><span className="font-bold">Código de invitación:</span> <span className="font-mono">{comp.invite_code}</span></p>
                  )}
                  <p><span className="font-bold">Miembros:</span> {comp.member_count}</p>
                  <p><span className="font-bold">Tus puntos:</span> {comp.my_points}</p>
                  <p><span className="font-bold">Tu posición:</span> {comp.my_ranking}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {comp.leagues.map((league, index) => (
                      <div key={index} className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded text-sm">
                        <span>{league.league_name}</span>
                        <span className="text-gray-500">({league.league_season})</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <button
                      onClick={() => navigate(`/ranking?competencia_id=${comp.id}`)}
                      className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                    >
                      Ver Ranking
                    </button>
                    {comp.is_creator && (
                      <button
                        onClick={() => handleDeleteCompetition(comp.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Eliminar competencia
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-md max-w-2xl w-full relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={handleCloseCreate}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl font-bold"
            >
              ×
            </button>
            <CrearCompetencia onSuccess={handleCloseCreate} />
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-md max-w-2xl w-full relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={handleCloseJoin}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl font-bold"
            >
              ×
            </button>
            <UnirseCompetencia onSuccess={handleCloseJoin} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;