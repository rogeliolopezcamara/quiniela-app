import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="w-64 h-screen bg-gray-100 flex flex-col justify-between p-4 fixed left-0 top-0 shadow-md">
      <div>
        <h2 className="text-2xl font-bold mb-6">Menú</h2>
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

      <div>
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default Sidebar;