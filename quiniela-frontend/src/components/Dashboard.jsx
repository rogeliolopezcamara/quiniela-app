// src/components/Dashboard.jsx
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useEffect, useState } from "react";
import axios from "../utils/axiosConfig";

const baseUrl = import.meta.env.VITE_API_URL;

function Dashboard() {
  const { authToken, logout } = useAuth();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [userCompetitions, setUserCompetitions] = useState([]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleGoToCreateCompetition = () => {
    navigate("/crear-competencia");
  };

  const handleGoToJoinCompetition = () => {
    navigate("/unirse-a-competencia");
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

    const fetchUserCompetitions = async () => {
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

    if (authToken) {
      fetchProfile();
      fetchUserCompetitions();
    }
  }, [authToken]);

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
            <p>
              Registrado desde:{" "}
              <span className="font-semibold">
                {new Date(userInfo.created_at).toLocaleDateString("es-ES")}
              </span>
            </p>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-center gap-4 mb-8">
          <button
            onClick={handleGoToCreateCompetition}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Crear nueva competencia
          </button>
          <button
            onClick={handleGoToJoinCompetition}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Unirse a competencia
          </button>
        </div>

        <div className="mt-10 text-left max-w-xl mx-auto">
          <h2 className="text-xl font-semibold mb-3">🏆 Tus competencias</h2>
          {userCompetitions.length === 0 ? (
            <p className="text-gray-600">Aún no perteneces a ninguna competencia.</p>
          ) : (
            <ul className="space-y-3">
              {userCompetitions.map((comp) => (
                <li key={comp.id} className="border p-3 rounded shadow text-left">
                  <p><span className="font-bold">Nombre:</span> {comp.name}</p>
                  {!comp.is_public && (
                    <p><span className="font-bold">Código de invitación:</span> <span className="font-mono">{comp.invite_code}</span></p>
                  )}
                  <p><span className="font-bold">Miembros:</span> {comp.member_count}</p>
                  <p><span className="font-bold">Tus puntos:</span> {comp.my_points}</p>
                  <p><span className="font-bold">Tu posición:</span> {comp.my_ranking}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {comp.leagues.map((league, index) => (
                      <div key={index} className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded">
                        {league.league_logo && (
                          <img src={league.league_logo} alt="logo" className="w-6 h-6" />
                        )}
                        <span>{league.league_name}</span>
                      </div>
                    ))}
                  </div>
                  {comp.is_creator && (
                    <div className="mt-2">
                      <button
                        onClick={() => handleDeleteCompetition(comp.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Eliminar competencia
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;