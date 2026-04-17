import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import Layout from './components/Layout';
import AppSwitcher from './components/AppSwitcher';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Templates from './pages/Templates';
import Schedules from './pages/Schedules';
import ScheduleDetail from './pages/ScheduleDetail';
import Absences from './pages/Absences';
import Setup from './pages/Setup';
import EikenHome from './pages/eiken/EikenHome';
import EikenHistory from './pages/eiken/EikenHistory';
import RamenHome from './pages/ramen/RamenHome';
import RamenHistory from './pages/ramen/RamenHistory';
import InstagramAnalytics from './pages/ramen/InstagramAnalytics';
import AiEduHome from './pages/aiedu/AiEduHome';
import AiEduHistory from './pages/aiedu/AiEduHistory';
import { useApp } from './contexts/AppContext';

function ShiftSyncApp() {
  const { currentOrg, loading } = useApp();

  if (loading && !currentOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!currentOrg) {
    return <Setup />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/schedules" element={<Schedules />} />
        <Route path="/schedules/:id" element={<ScheduleDetail />} />
        <Route path="/absences" element={<Absences />} />
        <Route path="*" element={<Navigate to="/shiftsync" />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('auth_token') || '');

  if (!token) {
    return <LoginScreen onLogin={setToken} />;
  }

  return (
    <Routes>
      <Route path="/" element={<AppSwitcher />} />
      <Route path="/shiftsync/*" element={<ShiftSyncApp />} />
      <Route path="/eiken" element={<EikenHome />} />
      <Route path="/eiken/history" element={<EikenHistory />} />
      <Route path="/ramen" element={<RamenHome />} />
      <Route path="/ramen/history" element={<RamenHistory />} />
      <Route path="/ramen/analytics" element={<InstagramAnalytics />} />
      <Route path="/aiedu" element={<AiEduHome />} />
      <Route path="/aiedu/history" element={<AiEduHistory />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
