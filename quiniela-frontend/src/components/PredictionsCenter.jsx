// src/components/PredictionsCenter.jsx
import { useState } from "react";
import Sidebar from "./Sidebar";
import AvailableMatches from "./AvailableMatches";
import UserPredictions from "./UserPredictions";

const PredictionsCenter = () => {
  const [activeTab, setActiveTab] = useState("available");

  return (
    <>
      <Sidebar />
      <div className="pt-20 px-4 max-w-5xl mx-auto">
        <div className="flex justify-center mb-8">
          <button
            className={`px-4 py-2 rounded-l-lg font-semibold border border-gray-300 transition-all duration-200 hover:bg-gray-100 ${
              activeTab === "available" ? "bg-gray-200" : "bg-white"
            }`}
            onClick={() => setActiveTab("available")}
          >
            Próximos partidos
          </button>
          <button
            className={`px-4 py-2 rounded-r-lg font-semibold border-t border-b border-r border-gray-300 transition-all duration-200 hover:bg-gray-100 ${
              activeTab === "predictions" ? "bg-gray-200" : "bg-white"
            }`}
            onClick={() => setActiveTab("predictions")}
          >
            Mis pronósticos
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          {activeTab === "available" ? <AvailableMatches embedded /> : <UserPredictions embedded />}
        </div>
      </div>
    </>
  );
};

export default PredictionsCenter;