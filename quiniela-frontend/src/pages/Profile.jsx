// src/pages/Profile.jsx
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Sidebar from "../components/Sidebar";
const baseUrl = import.meta.env.VITE_API_URL;

const Profile = () => {
  const { authToken, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    data: profile,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await axios.get(`${baseUrl}/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      return response.data;
    },
    enabled: !!authToken,
    staleTime: 1000 * 60,
  });

  const [editingField, setEditingField] = useState(null);
  const [newValue, setNewValue] = useState("");
  const [resetLink, setResetLink] = useState(null);
  const [message, setMessage] = useState("");


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
      refetch();
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

// Show loading message below Sidebar and title
let loadingMessage = null;
if (isLoading) {
  loadingMessage = <p className="text-gray-600 text-center mt-4">{t('loading')}</p>;
} else if (error) {
  loadingMessage = <p className="text-red-600 text-center mt-4">{t('error_loading_profile')}</p>;
}

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <div className="flex-grow p-6 w-full max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-6 border-b pb-2 border-gray-300">{t('my_profile')}</h1>
        {loadingMessage}

        {/* Mensaje para no autenticado */}
        {!authToken && (
          <p className="text-gray-700 mb-6">
            {t('not_logged_in_message')}
          </p>
        )}

        {message && <p className="mb-4 text-blue-600">{message}</p>}

        {authToken && (
          <>
            {/* Nombre */}
            <div className="mb-6 bg-white rounded-lg shadow p-4">
              <p className="font-semibold text-gray-700 mb-1">{t('name')}</p>
              {editingField === "name" ? (
                <>
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                  <button onClick={handleUpdate} className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                    {t('save')}
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span>{profile?.name}</span>
                  <button onClick={() => handleEdit("name")} className="text-blue-600 hover:underline">
                    {t('edit')}
                  </button>
                </div>
              )}
            </div>

            {/* Correo */}
            <div className="mb-6 bg-white rounded-lg shadow p-4">
              <p className="font-semibold text-gray-700 mb-1">{t('email')}</p>
              {editingField === "email" ? (
                <>
                  <input
                    type="email"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                  <button onClick={handleUpdate} className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                    {t('save')}
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span>{profile?.email}</span>
                  <button onClick={() => handleEdit("email")} className="text-blue-600 hover:underline">
                    {t('edit')}
                  </button>
                </div>
              )}
            </div>

            {/* Contraseña */}
            <div className="mb-6 bg-white rounded-lg shadow p-4">
              <p className="font-semibold text-gray-700 mb-1">{t('password')}</p>
              <button onClick={handlePasswordReset} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                {t('generate_reset_link')}
              </button>
              {resetLink && (
                <p className="mt-2 text-sm break-words text-green-600">
                  {t('link')}: <a href={resetLink} className="underline" target="_blank" rel="noreferrer">{resetLink}</a>
                </p>
              )}
            </div>
          </>
        )}
        <div className="mt-10">
          {authToken ? (
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              {t('logout')}
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {t('login')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;