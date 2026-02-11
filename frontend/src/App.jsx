import React, { useState, useEffect } from 'react';
import { ChevronRight, LogOut } from 'lucide-react';

import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SuratMasuk from './pages/SuratMasuk';
import SuratKeluar from './pages/SuratKeluar';
import BuatSurat from './pages/BuatSurat';
import MasterData from './pages/MasterData';
import MonitoringAnggaran from './pages/MonitoringAnggaran';
import Settings from './pages/Settings';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auth state
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Logo Kabupaten Tuban (Digunakan di Sidebar dan Preview Surat)
  const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Lambang_Kabupaten_Tuban.png/480px-Lambang_Kabupaten_Tuban.png";

  // Daftar 11 Desa Kecamatan Grabagan
  const villages = [
    "Banyubang", "Dahor", "Dermawuharjo", "Gesikan", "Grabagan",
    "Menyunyur", "Ngandong", "Ngarum", "Ngrejeng", "Pakis", "Waleran"
  ];

  // Check for existing session on app load
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      // Verify token is still valid
      fetch('http://localhost:3000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Token expired');
        })
        .then(userData => {
          setUser(userData);
          setToken(savedToken);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setActiveTab('dashboard');
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} villages={villages} />;
      case 'surat-masuk': return <SuratMasuk setActiveTab={setActiveTab} villages={villages} />;
      case 'surat-keluar': return <SuratKeluar setActiveTab={setActiveTab} villages={villages} userRole={user.role} token={token} />;
      case 'buat-surat': return <BuatSurat villages={villages} logoUrl={logoUrl} />;
      case 'monitoring-anggaran': return <MonitoringAnggaran />;
      case 'master-data': return <MasterData villages={villages} />;
      case 'settings': return <Settings />;
      default: return <Dashboard setActiveTab={setActiveTab} villages={villages} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        logoUrl={logoUrl}
        user={user}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-500 active:scale-95">
              <ChevronRight className={`transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className="hidden lg:flex flex-col">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Sistem Informasi Tata Kelola Surat Rekomendasi</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white text-slate-600 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              TA 2026
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold ${user.role === 'OPERATOR' ? 'bg-violet-600' : 'bg-blue-600'}`}>
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-bold text-slate-700 leading-tight">{user.name}</p>
                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-[1400px] mx-auto w-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
