// CrearGrupo.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import axios from "../utils/axiosConfig";

const baseUrl = import.meta.env.VITE_API_URL;

function CrearGrupo() {
  const { authToken } = useAuth();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!groupName.trim()) {
      setError("Debes ingresar un nombre para el grupo");
      return;
    }

    try {
      const response = await axios.post(
        `${baseUrl}/groups/`,
        { name: groupName },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      setSuccess(`✅ Grupo creado con éxito. Código: ${response.data.group.invite_code}`);
      setGroupName("");
    } catch (err) {
      setError("❌ No se pudo crear el grupo. Intenta de nuevo.");
      console.error(err);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="mt-20 px-4 w-full max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Crear nuevo grupo</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="groupName" className="block mb-1 font-medium">
              Nombre del grupo
            </label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Ej. Amigos Mundial 2025"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Crear grupo
          </button>
        </form>

        {success && <p className="mt-4 text-green-600">{success}</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export default CrearGrupo;