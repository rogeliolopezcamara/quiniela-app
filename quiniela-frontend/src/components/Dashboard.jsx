// src/components/Dashboard.jsx
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import axios from "../utils/axiosConfig";
import CrearCompetencia from "../pages/CrearCompetencia";
import UnirseCompetencia from "../pages/UnirseCompetencia";
import { useQuery } from '@tanstack/react-query';

const baseUrl = import.meta.env.VITE_API_URL;

function Dashboard() {
  const { t } = useTranslation();
  const { authToken, logout } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const {
    data: userInfo,
    isLoading: loadingUser,
    error: userError,
  } = useQuery({
    queryKey: ['userInfo'],
    queryFn: async () => {
      const res = await axios.get(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return res.data;
    },
    enabled: !!authToken,
    staleTime: 1000 * 60, // 1 minuto
  });

  const {
    data: userCompetitions = [],
    isLoading: loadingCompetitions,
    error: competitionsError,
    refetch: refetchCompetitions,
  } = useQuery({
    queryKey: ['userCompetitions'],
    queryFn: async () => {
      const res = await axios.get(`${baseUrl}/my-competitions-with-stats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return res.data;
    },
    enabled: !!authToken,
    refetchInterval: 10000, // actualiza cada 10s
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDeleteCompetition = async (competitionId) => {
    const confirmed = window.confirm(t('confirm_delete_competition'));
    if (!confirmed) return;

    try {
      await axios.delete(`${baseUrl}/competitions/${competitionId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      refetchCompetitions();
      alert(t('competition_deleted_success'));
    } catch (error) {
      console.error("Error al eliminar competencia:", error);
      alert(t('competition_delete_error'));
    }
  };

  const handleCloseCreate = () => {
    setShowCreateModal(false);
    refetchCompetitions();
  };

  const handleCloseJoin = () => {
    setShowJoinModal(false);
    refetchCompetitions();
  };

  return (
    <div className="flex">
      <Sidebar />
      {loadingUser || loadingCompetitions ? (
        <div className="text-center mt-10 text-gray-600">{t('loading')}</div>
      ) : userError || competitionsError ? (
        <div className="text-center mt-10 text-red-600">{t('error_loading_data')}</div>
      ) : (
        <div className="mt-4 mb-24 w-full text-center px-4 md:mt-20">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">
            {t('welcome')}{userInfo ? `, ${userInfo.name}` : ""}
          </h1>

          {userInfo && (
            <div className="mb-6 space-y-2">
              <p className="text-gray-700">
                Email: <span className="font-semibold">{userInfo.email}</span>
              </p>
            </div>
          )}

          <div className="bg-gray-100 border rounded-lg p-6 mb-8 max-w-xl mx-auto">
            <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">{t('manage_competitions')}</h2>
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-br from-blue-100 to-blue-300 hover:from-blue-200 hover:to-blue-400 text-blue-900 font-medium py-2 px-4 rounded shadow-md transition duration-300"
              >
                {t('create_new')}
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="bg-gradient-to-br from-indigo-100 to-indigo-300 hover:from-indigo-200 hover:to-indigo-400 text-indigo-900 font-medium py-2 px-4 rounded shadow-md transition duration-300"
              >
                {t('join')}
              </button>
            </div>
          </div>

          <div className="mt-10 text-left max-w-xl mx-auto">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">🏆 {t('your_competitions')}</h2>
            {userCompetitions.length === 0 ? (
              <p className="text-gray-600">{t('no_competitions')}</p>
            ) : (
              <ul className="space-y-3">
                {userCompetitions.map((comp) => (
                  <li key={comp.id} className="border p-4 rounded-lg shadow-md bg-white">
                    <div className="flex items-center gap-4 mb-4">
                      {comp.leagues.length > 0 && comp.leagues[0].league_logo && (
                        <img
                          src={comp.leagues[0].league_logo}
                          alt="logo"
                          className="w-12 h-12 object-contain"
                        />
                      )}
                      <h3 className="text-2xl font-bold text-gray-800 text-center">{comp.leagues.length > 0 ? comp.leagues[0].league_name : t('competition')}</h3>
                    </div>
                    <p className="text-lg font-semibold mb-1">{comp.name}</p>
                    {!comp.is_public && (
                      <p><span className="font-bold">{t('invite_code')}:</span> <span className="font-mono">{comp.invite_code}</span></p>
                    )}
                    <p><span className="font-bold">{t('members')}:</span> {comp.member_count}</p>
                    <p><span className="font-bold">{t('your_points')}:</span> {comp.my_points}</p>
                    <p><span className="font-bold">{t('your_position')}:</span> {comp.my_ranking}</p>
                    <div className="flex gap-2 mt-4 flex-wrap">
                      <button
                        onClick={() => navigate(`/ranking?competencia_id=${comp.id}`)}
                        className="bg-gradient-to-br from-blue-100 to-blue-300 hover:from-blue-200 hover:to-blue-400 text-blue-900 px-3 py-1 rounded shadow-md transition duration-300"
                      >
                        {t('view_ranking')}
                      </button>
                      {comp.is_creator && (
                        <button
                          onClick={() => handleDeleteCompetition(comp.id)}
                          className="bg-gradient-to-br from-red-100 to-red-300 hover:from-red-200 hover:to-red-400 text-red-900 px-3 py-1 rounded shadow-md transition duration-300"
                        >
                          {t('delete')}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-md max-w-2xl w-full relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={handleCloseCreate}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl font-bold"
            >
              ×
            </button>
            <CrearCompetencia onSuccess={handleCloseCreate} />
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-md max-w-2xl w-full relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={handleCloseJoin}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl font-bold"
            >
              ×
            </button>
            <UnirseCompetencia onSuccess={handleCloseJoin} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;