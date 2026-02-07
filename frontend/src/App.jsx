import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SuratMasuk from './pages/SuratMasuk';
import SuratKeluar from './pages/SuratKeluar';
import BuatSurat from './pages/BuatSurat';
import MasterData from './pages/MasterData';
import Settings from './pages/Settings';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Logo Kabupaten Tuban (Digunakan di Sidebar dan Preview Surat)
  const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Lambang_Kabupaten_Tuban.png/480px-Lambang_Kabupaten_Tuban.png";

  // Daftar 11 Desa Kecamatan Grabagan
  const villages = [
    "Banyubang", "Dahor", "Dermawuharjo", "Gesikan", "Grabagan",
    "Menyunyur", "Ngandong", "Ngarum", "Ngrejeng", "Pakis", "Waleran"
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} villages={villages} />;
      case 'surat-masuk': return <SuratMasuk setActiveTab={setActiveTab} villages={villages} />;
      case 'surat-keluar': return <SuratKeluar setActiveTab={setActiveTab} villages={villages} />;
      case 'buat-surat': return <BuatSurat villages={villages} logoUrl={logoUrl} />;
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
          <div className="flex items-center gap-4">
            <div className="bg-white text-slate-600 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              TA 2026
            </div>
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
