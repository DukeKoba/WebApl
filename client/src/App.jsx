import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RaceList from './pages/RaceList';
import RaceDetail from './pages/RaceDetail';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<RaceList />} />
        <Route path="/race/:id" element={<RaceDetail />} />
      </Routes>
    </Layout>
  );
}
