import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Templates from './pages/Templates';
import Schedules from './pages/Schedules';
import ScheduleDetail from './pages/ScheduleDetail';
import Absences from './pages/Absences';
import Setup from './pages/Setup';
import { useApp } from './contexts/AppContext';

export default function App() {
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
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
