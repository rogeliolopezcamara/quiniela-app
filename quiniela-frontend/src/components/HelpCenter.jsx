// src/components/HelpCenter.jsx
import { useState } from "react";
import Sidebar from "./Sidebar";
import Instructions from "./Instructions";
import Changelog from "./Changelog";

const HelpCenter = () => {
  const [activeTab, setActiveTab] = useState("instructions");

  return (
    <>
      <Sidebar />
      <div className="pt-6 pb-24 px-4 max-w-5xl mx-auto">
        <div className="sticky top-0 bg-white z-10">
          <div className="flex justify-center mb-8">
          <button
            className={`px-4 py-2 rounded-l-lg font-semibold border border-gray-300 transition-all duration-200 hover:bg-gray-100 ${
              activeTab === "instructions" ? "bg-gray-200" : "bg-white"
            }`}
            onClick={() => setActiveTab("instructions")}
          >
            Instrucciones
          </button>
          <button
            className={`px-4 py-2 rounded-r-lg font-semibold border-t border-b border-r border-gray-300 transition-all duration-200 hover:bg-gray-100 ${
              activeTab === "changelog" ? "bg-gray-200" : "bg-white"
            }`}
            onClick={() => setActiveTab("changelog")}
          >
            Novedades
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
