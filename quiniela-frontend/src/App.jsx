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


function App() {
  const { authToken } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/matches" element={<AvailableMatches />} />
        <Route path="/my-predictions" element={<UserPredictions />} />
        <Route path="/changelog" element={<Changelog />} />
      </Routes>
    </Router>
  );
}

export default App;


