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
    <div className="flex">
      <Sidebar />
      <div className="ml-64 p-6 w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>

        {message && <p className="mb-4 text-blue-600">{message}</p>}

        {/* Nombre */}
        <div className="mb-6">
          <p className="font-semibold">Nombre:</p>
          {editingField === "name" ? (
            <>
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="border p-1 mt-1"
              />
              <button onClick={handleUpdate} className="ml-2 bg-green-500 text-white px-2 py-1 rounded">
                Guardar
              </button>
            </>
          ) : (
            <>
              <span>{profile.name}</span>
              <button onClick={() => handleEdit("name")} className="ml-2 text-blue-600 hover:underline">
                Editar
              </button>
            </>
          )}
        </div>

        {/* Correo */}
        <div className="mb-6">
          <p className="font-semibold">Correo:</p>
          {editingField === "email" ? (
            <>
              <input
                type="email"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="border p-1 mt-1"
              />
              <button onClick={handleUpdate} className="ml-2 bg-green-500 text-white px-2 py-1 rounded">
                Guardar
              </button>
            </>
          ) : (
            <>
              <span>{profile.email}</span>
              <button onClick={() => handleEdit("email")} className="ml-2 text-blue-600 hover:underline">
                Editar
              </button>
            </>
          )}
        </div>

        {/* Contraseña */}
        <div className="mb-6">
          <p className="font-semibold">Contraseña:</p>
          <button onClick={handlePasswordReset} className="bg-blue-600 text-white px-4 py-2 rounded">
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