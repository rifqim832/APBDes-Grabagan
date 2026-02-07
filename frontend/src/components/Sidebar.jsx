import React from 'react';
import logo from '../assets/logo.png';
import {
    LayoutDashboard,
    MailWarning,
    MailCheck,
    FilePlus2,
    Database,
    Settings
} from 'lucide-react';

const NavItem = ({ icon, label, active, onClick, isOpen }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
    >
        <span className={`shrink-0 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
            {icon}
        </span>
        {isOpen && <span className="font-medium text-sm tracking-tight">{label}</span>}
    </button>
);

const Sidebar = ({ activeTab, setActiveTab, sidebarOpen }) => {
    return (
        <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-2xl z-20`}>
            <div className="p-4 flex items-center gap-3 border-b border-slate-800 overflow-hidden min-h-[88px]">
                <div className="p-1.5 rounded-xl shrink-0 shadow-md">
                    <img
                        src={logo}
                        alt="Logo Kabupaten Tuban"
                        className="w-10 h-10 object-contain"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=TUBAN'; }}
                    />
                </div>
                {sidebarOpen && (
                    <div className="flex flex-col leading-tight animate-in fade-in duration-500">
                        <span className="font-semibold text-[10px] text-slate-400 uppercase tracking-[0.2em]">Pemerintah Kab. Tuban</span>
                        <span className="font-extrabold text-lg tracking-tight truncate">Kec. Grabagan</span>
                    </div>
                )}
            </div>

            <nav className="flex-1 py-6 overflow-y-auto px-3 space-y-1">
                <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isOpen={sidebarOpen} />
                <NavItem icon={<MailWarning size={20} />} label="Surat Masuk" active={activeTab === 'surat-masuk'} onClick={() => setActiveTab('surat-masuk')} isOpen={sidebarOpen} />
                <NavItem icon={<MailCheck size={20} />} label="Surat Keluar" active={activeTab === 'surat-keluar'} onClick={() => setActiveTab('surat-keluar')} isOpen={sidebarOpen} />

                <div className={`px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ${!sidebarOpen && 'text-center px-0'}`}>
                    {sidebarOpen ? 'Core Engine' : '•••'}
                </div>

                <NavItem icon={<FilePlus2 size={20} />} label="Buat Surat" active={activeTab === 'buat-surat'} onClick={() => setActiveTab('buat-surat')} isOpen={sidebarOpen} />

                <div className={`px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ${!sidebarOpen && 'text-center px-0'}`}>
                    {sidebarOpen ? 'Data & Sistem' : '•••'}
                </div>

                <NavItem icon={<Database size={20} />} label="Master Data" active={activeTab === 'master-data'} onClick={() => setActiveTab('master-data')} isOpen={sidebarOpen} />
                <NavItem icon={<Settings size={20} />} label="Pengaturan" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} isOpen={sidebarOpen} />
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center border border-blue-400 shadow-lg shadow-blue-900/20 text-sm font-bold">
                        A
                    </div>
                    {sidebarOpen && (
                        <div className="overflow-hidden animate-in slide-in-from-left-2 duration-300">
                            <p className="text-xs font-semibold truncate text-slate-200 font-normal">Admin Kecamatan</p>
                            <p className="text-[10px] text-slate-500 font-medium tracking-tight">SISO-APBDes v2.1</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
