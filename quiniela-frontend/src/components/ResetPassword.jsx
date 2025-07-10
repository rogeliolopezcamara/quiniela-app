// src/components/ResetPassword.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: password }),
      });

      if (response.ok) {
        setMessage("✅ Contraseña actualizada exitosamente.");
        setTimeout(() => navigate("/login"), 2000); // redirigir después de 2s
      } else {
        const data = await response.json();
        setError(data.detail || "Error al cambiar la contraseña");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <div className="pt-20 px-4 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-4">Restablecer contraseña</h1>

      {message && <p className="text-green-600 mb-4">{message}</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleReset}>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full p-2 mb-4 border"
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Cambiar contraseña
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;