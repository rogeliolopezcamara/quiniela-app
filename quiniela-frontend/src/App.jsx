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


function App() {
  const { authToken } = useAuth();

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
      </Routes>
    </Router>
  );
}

export default App;


