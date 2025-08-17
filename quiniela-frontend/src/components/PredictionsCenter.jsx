// src/components/PredictionsCenter.jsx
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import Sidebar from "./Sidebar";
import AvailableMatches from "./AvailableMatches";
import UserPredictions from "./UserPredictions";

const PredictionsCenter = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("activeTab") || "available");

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  return (
    <>
      <Sidebar />
      <div className="sticky top-[env(safe-area-inset-top)] bg-white z-30 shadow-md flex justify-center py-4">
        <div className="inline-flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            className={`px-4 py-2 font-semibold transition-all duration-200 ${
              activeTab === "available" ? "bg-gray-200" : "bg-white"
            }`}
            onClick={() => setActiveTab("available")}
          >
            {t('upcoming_matches')}
          </button>
          <button
            className={`px-4 py-2 font-semibold transition-all duration-200 ${
              activeTab === "predictions" ? "bg-gray-200" : "bg-white"
            }`}
            onClick={() => setActiveTab("predictions")}
          >
            {t('my_predictions')}
          </button>
        </div>
      </div>
      <div className="pt-[env(safe-area-inset-top)] px-4 pb-[env(safe-area-inset-bottom)] max-w-5xl mx-auto">
        {activeTab === "available" ? <AvailableMatches embedded /> : <UserPredictions embedded />}
      </div>
    </>
  );
};

export default PredictionsCenter;