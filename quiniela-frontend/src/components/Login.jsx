import { useState } from "react";
import axios from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const baseUrl = import.meta.env.VITE_API_URL;

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!baseUrl) {
      console.error("❌ VITE_API_URL no está definido");
      setError("Error interno de configuración");
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await axios.post(`${baseUrl}/login`, formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const { access_token, user_id } = response.data;

      if (!access_token) {
        throw new Error("Token no recibido");
      }

      login(access_token, user_id);
      console.log("Login exitoso:", access_token, user_id);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error al hacer login:", err);
      if (err.response?.status === 400) {
        setError("Credenciales inválidas");
      } else if (err.message === "Token no recibido") {
        setError("Error al recibir token del servidor");
      } else {
        setError("Error de conexión con el servidor");
      }
    }
  };

  return (
    <form onSubmit={handleLogin} className="max-w-sm mx-auto mt-20">
      <h1 className="text-2xl mb-4">Iniciar sesión</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="block w-full p-2 mb-4 border"
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="block w-full p-2 mb-4 border"
        required
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Entrar
      </button>

      <p className="text-center mt-4 text-sm">
        ¿No tienes cuenta?{" "}
        <span
          className="text-blue-500 hover:underline cursor-pointer"
          onClick={() => navigate("/register")}
        >
          Regístrate
        </span>
      </p>
    </form>
  );
}

export default Login;