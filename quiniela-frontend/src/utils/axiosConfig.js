// src/utils/axiosConfig.js
import axios from "axios";

const baseUrl = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: baseUrl,
});

// Aquí se almacena el callback externo para logout
let onUnauthorizedCallback = null;

// Función para registrar el callback de logout (la usaremos desde App.jsx)
export const registerOnUnauthorized = (callback) => {
  onUnauthorizedCallback = callback;
};

// Interceptor para manejar errores 401 (token expirado, inválido, etc.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && onUnauthorizedCallback) {
      alert("Tu sesión ha expirado. Se cerrará la sesión.");
      onUnauthorizedCallback(); // hace logout
      window.location.reload(); // fuerza recarga para mostrar vista de no autenticado
    }
    return Promise.reject(error);
  }
);

export default api;