import React, { useState, useEffect } from 'react';
import {
    Plus,
    MailWarning,
    MailCheck,
    History,
    Clock,
    BarChart3
} from 'lucide-react';
import { getDesa, getStats, getOutgoingLetters, getMonitoringAnggaran } from '../services/api';

const StatCard = ({ title, value, icon, trend, color = "bg-white" }) => (
    <div className={`${color} p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between h-full hover:shadow-md transition-all`}>
        <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1 font-normal">{title}</p>
            <h4 className="text-4xl font-extrabold text-slate-900 tracking-tighter font-normal">{value}</h4>
            {trend && <p className="text-[10px] text-emerald-600 mt-3 font-bold bg-emerald-50 px-2.5 py-1 rounded-full inline-block border border-emerald-100 font-normal">{trend}</p>}
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">
            {icon}
        </div>
    </div>
);

const Dashboard = ({ setActiveTab }) => {
    const [villages, setVillages] = useState([]);
    const [stats, setStats] = useState({ totalIncoming: 0, totalOutgoing: 0, monthlyIncoming: 0, monthlyOutgoing: 0 });
    const [recentLetters, setRecentLetters] = useState([]);
    const [monitoring, setMonitoring] = useState({});

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        getDesa().then(data => setVillages(data)).catch(console.error);
        getStats().then(setStats).catch(console.error);
        getOutgoingLetters().then(data => setRecentLetters(data.slice(0, 3))).catch(console.error);
        getMonitoringAnggaran(currentYear).then(data => {
            // Build lookup by village name
            const lookup = {};
            (data.villages || []).forEach(v => { lookup[v.namaDesa] = v; });
            setMonitoring(lookup);
        }).catch(console.error);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard Ringkasan</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1 font-normal">Pantau performa tata kelola surat hari ini.</p>
                </div>
                <button
                    onClick={() => setActiveTab('buat-surat')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-xl shadow-blue-600/20 transition-all font-bold text-sm active:scale-95 font-normal"
                >
                    <Plus size={18} strokeWidth={3} /> Buat Surat Rekomendasi
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title={`Surat Masuk (${new Date().getFullYear()})`}
                    value={stats.totalIncoming}
                    icon={<MailWarning className="text-blue-600" />}
                    trend={`+${stats.monthlyIncoming} bulan ini`}
                />
                <StatCard
                    title="Rekomendasi Terbit"
                    value={stats.totalOutgoing}
                    icon={<MailCheck className="text-emerald-600" />}
                    trend={`+${stats.monthlyOutgoing} bulan ini`}
                />

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                            <History size={18} />
                        </div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-normal">Riwayat Aktivitas</h4>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto max-h-[140px] pr-2 custom-scrollbar">
                        {recentLetters.length === 0 ? (
                            <p className="text-sm text-slate-400 font-normal">Belum ada aktivitas.</p>
                        ) : (
                            recentLetters.map((letter) => (
                                <div key={letter.id} className="flex flex-col border-l-2 border-slate-100 pl-4 py-1 hover:border-blue-300 transition-colors">
                                    <p className="text-[13px] font-normal text-slate-700">
                                        Membuat rekomendasi <span className="text-blue-600 font-semibold">Desa {letter.village?.name}</span>
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5 font-normal">
                                        <Clock size={10} /> {new Date(letter.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                            <BarChart3 size={22} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase tracking-wider font-normal">
                            Rekapitulasi Surat Masuk Per Desa
                        </h3>
                    </div>
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 font-normal">Live {new Date().getFullYear()}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {villages.map((v) => {
                        const m = monitoring[v.name] || { jumlahSurat: 0, jumlahSpm: 0, realisasi: 0, sisa: 0, pagu: 0, persentase: 0 };
                        const persen = m.persentase || 0;
                        const barColor = persen >= 100 ? 'bg-red-500' : persen >= 75 ? 'bg-amber-500' : persen >= 50 ? 'bg-blue-500' : 'bg-emerald-500';
                        const textColor = persen >= 100 ? 'text-red-600' : persen >= 75 ? 'text-amber-600' : persen >= 50 ? 'text-blue-600' : 'text-emerald-600';
                        return (
                            <div key={v.id} className="group border border-slate-100 rounded-2xl p-4 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-default bg-slate-50/50">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-white text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shrink-0">
                                        {v.id}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 uppercase tracking-tight truncate">{v.name}</p>
                                        <p className="text-[10px] text-slate-400">{m.jumlahSurat} surat — {m.jumlahSpm || 0} SPM</p>
                                    </div>
                                </div>
                                {/* Mini Progress Bar */}
                                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                                    <div className={`h-1.5 rounded-full ${barColor} transition-all duration-700`} style={{ width: `${Math.min(persen, 100)}%` }}></div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-400">Realisasi</span>
                                        <span className="font-bold text-blue-600 font-mono">Rp {Number(m.realisasi).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-400">Sisa Pagu</span>
                                        <span className={`font-bold font-mono ${m.sisa < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {m.sisa < 0 ? '- ' : ''}Rp {Number(Math.abs(m.sisa)).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-400">SPM Entry</span>
                                        <span className="font-bold text-violet-600 font-mono">{m.jumlahSpm || 0}</span>
                                    </div>
                                    <div className="flex justify-end">
                                        <span className={`text-[10px] font-bold ${textColor}`}>{persen}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
