import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Menu, Home, Info, Trophy, CalendarDays, User } from "lucide-react";

function Sidebar() {
  const navigate = useNavigate();
  const { logout, authToken } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <>
      {/* Botón hamburguesa flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-200 rounded shadow-md"
      >
        <Menu />
      </button>

      {/* Menú lateral */}
      <div
        className={`fixed top-0 left-0 w-64 bg-white border-r border-gray-200 pt-16 px-4 shadow-md z-40 transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ height: "100dvh" }} // 💡 clave para móviles
      >
        <div className="flex flex-col h-full">
          {/* Parte scrollable */}
          <div className="flex-1 overflow-y-auto space-y-2">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 w-full text-left text-gray-700 hover:bg-gray-200 px-3 py-2 rounded transition"
            >
              <Info className="w-5 h-5" />
              Guía
            </button>
            {authToken && (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-2 w-full text-left text-gray-700 hover:bg-gray-200 px-3 py-2 rounded transition"
                >
                  <Home className="w-5 h-5" />
                  Inicio
                </button>
                <button
                  onClick={() => navigate("/ranking")}
                  className="flex items-center gap-2 w-full text-left text-gray-700 hover:bg-gray-200 px-3 py-2 rounded transition"
                >
                  <Trophy className="w-5 h-5" />
                  Ranking
                </button>
                <button
                  onClick={() => navigate("/matches")}
                  className="flex items-center gap-2 w-full text-left text-gray-700 hover:bg-gray-200 px-3 py-2 rounded transition"
                >
                  <CalendarDays className="w-5 h-5" />
                  Pronósticos
                </button>
              </>
            )}
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 w-full text-left text-gray-700 hover:bg-gray-200 px-3 py-2 rounded transition"
            >
              <User className="w-5 h-5" />
              Perfil
            </button>
          </div>

          {/* Parte fija abajo */}
          <div className="py-4 border-t border-gray-300">
            {authToken ? (
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Cerrar sesión
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;