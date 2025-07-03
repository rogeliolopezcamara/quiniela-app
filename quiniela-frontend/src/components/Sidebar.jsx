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
        className={`fixed top-0 left-0 min-h-screen w-64 bg-gray-100 p-4 pt-16 shadow-md transform transition-transform duration-300 z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Botones de navegación */}
        <div className="flex flex-col h-full">
          <div className="flex-grow">
            <ul className="space-y-4">
              <li>
                <button onClick={() => navigate("/")} className="text-left w-full text-blue-600 hover:underline">
                  Instrucciones
                </button>
              </li>
              <li>
                <button onClick={() => navigate("/ranking")} className="text-left w-full text-blue-600 hover:underline">
                  Ranking
                </button>
              </li>
              {authToken && (
                <>
                  <li>
                    <button onClick={() => navigate("/dashboard")} className="text-left w-full text-blue-600 hover:underline">
                      Dashboard
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("/matches")} className="text-left w-full text-blue-600 hover:underline">
                      Partidos
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("/my-predictions")} className="text-left w-full text-blue-600 hover:underline">
                      Mis Pronósticos
                    </button>
                  </li>
                </>
              )}
              <li>
                <button onClick={() => navigate("/changelog")} className="text-left w-full text-blue-600 hover:underline">
                  Novedades
                </button>
              </li>
            </ul>
          </div>

          {/* Botón inferior siempre visible al fondo */}
          <div className="mt-6">
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