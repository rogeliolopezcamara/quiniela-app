// src/components/PredictionsCenter.jsx
import { useState } from "react";
import Sidebar from "./Sidebar";
import AvailableMatches from "./AvailableMatches";
import UserPredictions from "./UserPredictions";

const PredictionsCenter = () => {
  const [selectedSection, setSelectedSection] = useState("available");

  return (
    <div className="flex">
      <Sidebar />
      <div className="pt-20 px-4 w-full max-w-5xl mx-auto">
        <div className="flex justify-center gap-6 mb-6 sticky top-20 bg-white z-10 py-2 shadow-md rounded">
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors duration-200 ${
              selectedSection === "available"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setSelectedSection("available")}
          >
            Próximos partidos
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors duration-200 ${
              selectedSection === "predictions"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setSelectedSection("predictions")}
          >
            Mis pronósticos
          </button>
        </div>

        {selectedSection === "available" && <AvailableMatches embedded={true} />}
        {selectedSection === "predictions" && <UserPredictions embedded={true} />}
      </div>
    </div>
  );
};

export default PredictionsCenter;