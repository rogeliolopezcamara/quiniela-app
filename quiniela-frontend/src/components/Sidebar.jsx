import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Menu } from "lucide-react";

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
        className={`fixed top-0 left-0 w-64 bg-gray-100 pt-16 px-4 shadow-md z-40 transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ height: "100dvh" }} // 💡 clave para móviles
      >
        <div className="flex flex-col h-full">
          {/* Parte scrollable */}
          <div className="flex-1 overflow-y-auto space-y-4">
            <button onClick={() => navigate("/")} className="text-left w-full text-blue-600 hover:underline">
              Guía
            </button>
            {authToken && (
              <>
                <button onClick={() => navigate("/dashboard")} className="text-left w-full text-blue-600 hover:underline">
                  Inicio
                </button>
                <button onClick={() => navigate("/ranking")} className="text-left w-full text-blue-600 hover:underline">
                  Ranking
                </button>
                <button onClick={() => navigate("/matches")} className="text-left w-full text-blue-600 hover:underline">
                  Partidos
                </button>
              </>
            )}
            <button onClick={() => navigate("/profile")} className="text-left w-full text-blue-600 hover:underline">
              Mi Perfil
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