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
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          Bienvenido{userInfo ? `, ${userInfo.name}` : ""}
        </h1>

        {userInfo && (
          <div className="mb-6 space-y-2">
            <p className="text-gray-700">
              Email: <span className="font-semibold">{userInfo.email}</span>
            </p>
          </div>
        )}

        <div className="bg-gray-100 border rounded-lg p-6 mb-8 max-w-xl mx-auto">
          <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">Gestiona tus competencias</h2>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-br from-blue-100 to-blue-300 hover:from-blue-200 hover:to-blue-400 text-blue-900 font-medium py-2 px-4 rounded shadow-md transition duration-300"
            >
              Crear nueva
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-gradient-to-br from-indigo-100 to-indigo-300 hover:from-indigo-200 hover:to-indigo-400 text-indigo-900 font-medium py-2 px-4 rounded shadow-md transition duration-300"
            >
              Unirse
            </button>
          </div>
        </div>

        <div className="mt-10 text-left max-w-xl mx-auto">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">🏆 Tus competencias</h2>
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
                    <h3 className="text-2xl font-bold text-gray-800 text-center">{comp.leagues.length > 0 ? comp.leagues[0].league_name : "Competencia"}</h3>
                  </div>
                  <p className="text-lg font-semibold mb-1">{comp.name}</p>
                  {!comp.is_public && (
                    <p><span className="font-bold">Código de invitación:</span> <span className="font-mono">{comp.invite_code}</span></p>
                  )}
                  <p><span className="font-bold">Miembros:</span> {comp.member_count}</p>
                  <p><span className="font-bold">Tus puntos:</span> {comp.my_points}</p>
                  <p><span className="font-bold">Tu posición:</span> {comp.my_ranking}</p>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <button
                      onClick={() => navigate(`/ranking?competencia_id=${comp.id}`)}
                      className="bg-gradient-to-br from-blue-100 to-blue-300 hover:from-blue-200 hover:to-blue-400 text-blue-900 px-3 py-1 rounded shadow-md transition duration-300"
                    >
                      Ver Ranking
                    </button>
                    {comp.is_creator && (
                      <button
                        onClick={() => handleDeleteCompetition(comp.id)}
                        className="bg-gradient-to-br from-red-100 to-red-300 hover:from-red-200 hover:to-red-400 text-red-900 px-3 py-1 rounded shadow-md transition duration-300"
                      >
                        Eliminar
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