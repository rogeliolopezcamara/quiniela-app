// src/components/JoinGroupForm.jsx
import { useState } from "react";
import axios from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

const baseUrl = import.meta.env.VITE_API_URL;

const JoinGroupForm = () => {
  const { authToken } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const response = await axios.post(
        `${baseUrl}/groups/join/`,
        { invite_code: inviteCode },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setMessage(response.data.message);
    } catch (error) {
      setMessage(
        error.response?.data?.detail || "Error al unirse al grupo"
      );
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="mt-20 w-full px-4">
        <h1 className="text-2xl font-bold text-center mb-6">
          Unirse a un grupo existente
        </h1>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 max-w-sm mx-auto"
        >
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Código del grupo"
            required
            className="border rounded px-4 py-2"
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Unirse
          </button>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}
      </div>
    </div>
  );
};

export default JoinGroupForm;