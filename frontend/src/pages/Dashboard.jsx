import React from 'react';
import {
    Plus,
    MailWarning,
    MailCheck,
    History,
    Clock,
    BarChart3
} from 'lucide-react';

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
    const [villages, setVillages] = React.useState([]);

    React.useEffect(() => {
        import('../services/api').then(({ getDesa }) => {
            getDesa().then(data => setVillages(data.map(d => d.nama))).catch(console.error);
        });
    }, []);

    const userActivities = [
        { id: 1, action: "Membuat Rekomendasi", target: "Desa Dahor", time: "10 mnt yang lalu" },
        { id: 2, action: "Mengarsip Surat Masuk", target: "Desa Gesikan", time: "1 jam yang lalu" },
        { id: 3, action: "Mencetak Ulang PDF", target: "Desa Waleran", time: "3 jam yang lalu" }
    ];

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
                <StatCard title="Surat Masuk (2026)" value="42" icon={<MailWarning className="text-blue-600" />} trend="+5 bulan ini" />
                <StatCard title="Rekomendasi Terbit" value="38" icon={<MailCheck className="text-emerald-600" />} trend="+3 bulan ini" />

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                            <History size={18} />
                        </div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-normal">Riwayat Aktivitas</h4>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto max-h-[140px] pr-2 custom-scrollbar">
                        {userActivities.map((act) => (
                            <div key={act.id} className="flex flex-col border-l-2 border-slate-100 pl-4 py-1 hover:border-blue-300 transition-colors">
                                <p className="text-[13px] font-normal text-slate-700">
                                    {act.action} <span className="text-blue-600">{act.target}</span>
                                </p>
                                <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5 font-normal">
                                    <Clock size={10} /> {act.time}
                                </p>
                            </div>
                        ))}
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
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 font-normal">Live 2026</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                    {villages.map((v, i) => {
                        const count = (i * 7 + 3) % 12 + 1;
                        return (
                            <div key={v} className="group border border-slate-100 rounded-2xl p-5 flex flex-col items-center text-center gap-3 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-default bg-slate-50/50">
                                <div className="bg-white text-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                                    {count}
                                </div>
                                <span className="text-xs font-normal text-slate-600 group-hover:text-slate-900 transition-colors uppercase">{v}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
