// src/components/Dashboard.jsx
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = import.meta.env.VITE_API_URL;

function Dashboard() {
  const { authToken, logout } = useAuth();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/");
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
            <p>Email: <span className="font-semibold">{userInfo.email}</span></p>
            <p>Registrado desde: <span className="font-semibold">{new Date(userInfo.created_at).toLocaleDateString("es-ES")}</span></p>
            <p>Puntos totales: <span className="font-semibold">{userInfo.total_points}</span></p>
          </div>
        )}

       
      </div>
    </div>
  );
}

export default Dashboard;