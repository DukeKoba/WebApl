import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [orgs, setOrgs] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadOrgs = useCallback(async () => {
    try {
      const data = await api.getOrgs();
      setOrgs(data);
      if (data.length > 0 && !currentOrg) {
        setCurrentOrg(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentOrg]);

  const loadOrgData = useCallback(async () => {
    if (!currentOrg) return;
    try {
      const [m, t, s] = await Promise.all([
        api.getMembers(currentOrg.id),
        api.getTemplates(currentOrg.id),
        api.getSchedules(currentOrg.id),
      ]);
      setMembers(m);
      setTemplates(t);
      setSchedules(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentOrg]);

  // 公開ツール(/family-sheet 等・ログイン不要)では認証付きの初期ロードをしない
  const isPublicPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/family-sheet');
  useEffect(() => { if (!isPublicPage) loadOrgs(); else setLoading(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (currentOrg) loadOrgData(); }, [currentOrg]);

  const value = {
    orgs, currentOrg, setCurrentOrg, members, templates, schedules,
    loading, toast, showToast, loadOrgs, loadOrgData,
    setMembers, setTemplates, setSchedules
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
