// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
const baseUrl = import.meta.env.VITE_API_URL;

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [newValue, setNewValue] = useState("");
  const [resetLink, setResetLink] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${baseUrl}/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setProfile(response.data);
    } catch (err) {
      console.error("Error al obtener el perfil:", err);
    }
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setNewValue(profile[field]);
    setMessage("");
  };

  const handleUpdate = async () => {
    try {
      await axios.put(
        `${baseUrl}/update-${editingField}/`,
        { [editingField]: newValue },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setMessage("✅ Actualización exitosa");
      setEditingField(null);
      fetchProfile();
    } catch (err) {
      console.error("Error al actualizar:", err);
      setMessage("❌ Error al actualizar");
    }
  };

  const handlePasswordReset = async () => {
    try {
      const response = await axios.post(
        `${baseUrl}/user-reset-link/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setResetLink(response.data.reset_link);
    } catch (err) {
      console.error("Error al generar link:", err);
      setMessage("❌ Error al generar el enlace");
    }
  };

  if (!profile) return <div className="p-6">Cargando...</div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <div className="flex-grow p-6 w-full max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-6 border-b pb-2 border-gray-300">👤 Mi Perfil</h1>

        {message && <p className="mb-4 text-blue-600">{message}</p>}

        {/* Nombre */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <p className="font-semibold text-gray-700 mb-1">Nombre:</p>
          {editingField === "name" ? (
            <>
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="border p-2 rounded w-full"
              />
              <button onClick={handleUpdate} className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                Guardar
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span>{profile.name}</span>
              <button onClick={() => handleEdit("name")} className="text-blue-600 hover:underline">
                Editar
              </button>
            </div>
          )}
        </div>

        {/* Correo */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <p className="font-semibold text-gray-700 mb-1">Correo:</p>
          {editingField === "email" ? (
            <>
              <input
                type="email"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="border p-2 rounded w-full"
              />
              <button onClick={handleUpdate} className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                Guardar
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span>{profile.email}</span>
              <button onClick={() => handleEdit("email")} className="text-blue-600 hover:underline">
                Editar
              </button>
            </div>
          )}
        </div>

        {/* Contraseña */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <p className="font-semibold text-gray-700 mb-1">Contraseña:</p>
          <button onClick={handlePasswordReset} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Generar enlace de restablecimiento
          </button>
          {resetLink && (
            <p className="mt-2 text-sm break-words text-green-600">
              Enlace: <a href={resetLink} className="underline" target="_blank" rel="noreferrer">{resetLink}</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;