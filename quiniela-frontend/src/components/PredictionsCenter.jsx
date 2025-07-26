// src/components/PredictionsCenter.jsx
import { useState } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from "./Sidebar";
import AvailableMatches from "./AvailableMatches";
import UserPredictions from "./UserPredictions";

const PredictionsCenter = () => {
  const [activeTab, setActiveTab] = useState("available");
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <>
        <Sidebar />
        <div className="fixed top-0 left-0 w-full bg-white shadow z-10 flex justify-center py-4">
          <div className="inline-flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              className={`px-4 py-2 font-semibold transition-all duration-200 ${
                activeTab === "available" ? "bg-gray-200" : "bg-white"
              }`}
              onClick={() => setActiveTab("available")}
            >
              Próximos partidos
            </button>
            <button
              className={`px-4 py-2 font-semibold transition-all duration-200 ${
                activeTab === "predictions" ? "bg-gray-200" : "bg-white"
              }`}
              onClick={() => setActiveTab("predictions")}
            >
              Mis pronósticos
            </button>
          </div>
        </div>
        <div className="pt-28 px-4 pb-28 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md p-6">
            {activeTab === "available" ? <AvailableMatches embedded /> : <UserPredictions embedded />}
          </div>
        </div>
      </>
    </QueryClientProvider>
  );
};

export default PredictionsCenter;