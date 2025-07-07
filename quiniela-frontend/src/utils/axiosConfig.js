// src/utils/axiosConfig.js
import axios from "axios";
import { logout } from "../context/AuthContext"; // asumiendo que tienes esta función

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // sesión expirada
      alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
      logout(); // <- esto limpia el contexto y localStorage
      window.location.reload(); // recarga con la interfaz de usuario sin sesión
    }
    return Promise.reject(error);
  }
);

export default instance;