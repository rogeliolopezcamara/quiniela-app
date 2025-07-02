import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Menu } from "lucide-react";

function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/");
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
        className={`fixed top-0 left-0 w-64 bg-gray-100 p-4 pt-16 shadow-md transform transition-transform duration-300 z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ maxHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        {/* Contenido con scroll si excede la pantalla */}
        <div className="overflow-y-auto flex-grow">
          <ul className="space-y-4">
            <li>
              <button onClick={() => navigate("/dashboard")} className="text-left w-full text-blue-600 hover:underline">
                Dashboard
              </button>
            </li>
            <li>
              <button onClick={() => navigate("/ranking")} className="text-left w-full text-blue-600 hover:underline">
                Ranking
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
          </ul>
        </div>

        {/* Botón de logout siempre visible */}
        <div className="mt-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;