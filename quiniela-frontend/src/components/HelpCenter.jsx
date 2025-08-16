// src/components/HelpCenter.jsx
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import Sidebar from "./Sidebar";
import Instructions from "./Instructions";
import Changelog from "./Changelog";

const HelpCenter = () => {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("helpTab") || "instructions");
  const { t } = useTranslation();

  useEffect(() => {
    localStorage.setItem("helpTab", activeTab);
  }, [activeTab]);

  return (
    <>
      <Sidebar />
      <div className="pb-24 px-4 max-w-5xl mx-auto">
        <div className="sticky top-0 bg-white z-30 shadow-md py-1">
          <div className="flex justify-center items-center h-full pt-3">
            <button
              className={`px-4 py-2 rounded-l-lg font-semibold border border-gray-300 transition-all duration-200 hover:bg-gray-100 ${
                activeTab === "instructions" ? "bg-gray-200" : "bg-white"
              }`}
              onClick={() => setActiveTab("instructions")}
            >
              {t('instructions_tab')}
            </button>
            <button
              className={`px-4 py-2 rounded-r-lg font-semibold border-t border-b border-r border-gray-300 transition-all duration-200 hover:bg-gray-100 ${
                activeTab === "changelog" ? "bg-gray-200" : "bg-white"
              }`}
              onClick={() => setActiveTab("changelog")}
            >
              {t('changelog_tab')}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          {activeTab === "instructions" ? <Instructions /> : <Changelog />}
        </div>
      </div>
    </>
  );
};

export default HelpCenter;
