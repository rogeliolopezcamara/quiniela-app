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
  const [userGroups, setUserGroups] = useState([]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleGoToCreateGroup = () => {
    navigate("/crear-grupo");
  };

  const handleGoToJoinGroup = () => {
    navigate("/unirse-a-grupo");
  };

  const handleDeleteGroup = async (groupId) => {
    const confirmed = window.confirm("¿Estás seguro de que deseas eliminar este grupo?");
    if (!confirmed) return;

    try {
      await axios.delete(`${baseUrl}/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setUserGroups((prev) => prev.filter((g) => g.id !== groupId));
      alert("Grupo eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar grupo:", error);
      alert("Hubo un error al eliminar el grupo");
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

    const fetchUserGroups = async () => {
      try {
        const response = await axios.get(`${baseUrl}/groups/my-groups-with-stats`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        setUserGroups(response.data);
      } catch (error) {
        console.error("Error al obtener grupos:", error);
      }
    };

    if (authToken) {
      fetchProfile();
      fetchUserGroups();
    }
  }, [authToken]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="mt-20 w-full text-center px-4">
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
            <p>
              Puntos totales:{" "}
              <span className="font-semibold">{userInfo.total_points}</span>
            </p>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-center gap-4 mb-8">
          <button
            onClick={handleGoToCreateGroup}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Crear nuevo grupo
          </button>
          <button
            onClick={handleGoToJoinGroup}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Unirse a grupo con código
          </button>
        </div>

        <div className="mt-10 text-left max-w-xl mx-auto">
          <h2 className="text-xl font-semibold mb-3">📋 Tus grupos</h2>
          {userGroups.length === 0 ? (
            <p className="text-gray-600">Aún no perteneces a ningún grupo.</p>
          ) : (
            <ul className="space-y-3">
              {userGroups.map((group) => (
                <li key={group.id} className="border p-3 rounded shadow text-left">
                  <p><span className="font-bold">Nombre:</span> {group.name}</p>
                  <p><span className="font-bold">Código de invitación:</span> <span className="font-mono">{group.invite_code}</span></p>
                  <p><span className="font-bold">Miembros:</span> {group.member_count}</p>
                  <p><span className="font-bold">Tu posición:</span> {group.my_ranking}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => navigate(`/ranking-grupo/${group.id}`)}
                      className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                    >
                      Ver ranking del grupo
                    </button>
                    {group.is_creator && (
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Eliminar grupo
                      </button>
                    )}
                  </div>
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