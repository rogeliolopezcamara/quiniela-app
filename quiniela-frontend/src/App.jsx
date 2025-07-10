// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Ranking from "./components/Ranking";
import AvailableMatches from "./components/AvailableMatches";
import UserPredictions from "./components/UserPredictions";
import { useAuth } from "./context/AuthContext";
import Register from "./components/Register";
import Changelog from "./components/Changelog";
import Instructions from "./components/Instructions";
import { useEffect } from "react";
import { registerOnUnauthorized } from "./utils/axiosConfig";
import { subscribeToNotifications } from "./utils/subscribeToNotifications";
import ResetPassword from "./components/ResetPassword";
import GenerateResetLink from "./components/GenerateResetLink";
import CrearGrupo from "./components/CrearGrupo";
import JoinGroupForm from "./components/JoinGroupForm";
import GroupRanking from "./components/GroupRanking";


function App() {
  const { authToken, logout } = useAuth();

  console.log("🔍 authToken:", authToken); // <- nuevo log
  console.log("🌐 Clave pública desde ENV:", import.meta.env.VITE_VAPID_PUBLIC_KEY);

  useEffect(() => {
    registerOnUnauthorized(logout);
  }, [logout]);

  useEffect(() => {
    if (authToken) {
      console.log("🔔 Intentando suscribirse a notificaciones...");
      subscribeToNotifications(); // ✅ Intenta suscribirse cuando el usuario está logueado
    }
  }, [authToken]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Instructions />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/matches" element={<AvailableMatches />} />
        <Route path="/my-predictions" element={<UserPredictions />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/admin/generar-reset" element={<GenerateResetLink />} />
        <Route path="/crear-grupo" element={<CrearGrupo />} />
        <Route path="/unirse-a-grupo" element={<JoinGroupForm />} />
        <Route path="/ranking-grupo/:group_id" element={<GroupRanking />} />
      </Routes>
    </Router>
  );
}

export default App;