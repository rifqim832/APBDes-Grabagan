import React, { useState } from 'react';
import { MailWarning, Plus, Search, Calendar } from 'lucide-react';
import ActionButtons from '../components/ActionButtons';

import { getDesa } from '../services/api';

const SuratMasuk = ({ setActiveTab }) => {
    const [villages, setVillages] = useState([]);
    const [search, setSearch] = useState("");

    React.useEffect(() => {
        getDesa().then(data => setVillages(data.map(d => d.nama))).catch(console.error);
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
                        <MailWarning size={22} />
                    </div>
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-800 font-normal">Log Surat Masuk</h2>
                </div>
                <button
                    onClick={() => setActiveTab('buat-surat')}
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 shadow-lg shadow-slate-900/10 font-bold transition-all text-xs uppercase tracking-widest active:scale-95 font-normal"
                >
                    <Plus size={16} strokeWidth={3} /> Buat Surat
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[280px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nomor surat permohonan..."
                            className="w-full pl-11 pr-4 py-3 border-slate-200 border rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none font-normal text-sm transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select className="border-slate-200 border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 min-w-[200px] font-normal text-slate-600 text-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_1rem_center] bg-no-repeat transition-all">
                        <option>Semua Desa</option>
                        {villages.map(v => <option key={v}>{v}</option>)}
                    </select>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input type="date" className="pl-11 pr-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 font-normal text-slate-600 text-sm transition-all shadow-sm bg-white" />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-600 text-white">
                                <th className="px-6 py-4 font-bold text-[11px] w-12 text-center uppercase tracking-widest border-r border-blue-500/30 font-normal">No</th>
                                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-widest border-r border-blue-500/30 font-normal">Nomor Surat</th>
                                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-widest border-r border-blue-500/30 font-normal">Desa</th>
                                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-widest border-r border-blue-500/30 font-normal">Tanggal</th>
                                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-widest text-right border-r border-blue-500/30 font-normal">Total Anggaran</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-center uppercase tracking-widest font-normal">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <tr key={i} className="hover:bg-blue-50/20 transition-all group">
                                    <td className="px-6 py-4 text-xs text-center font-semibold text-slate-400">{i + 1}</td>
                                    <td className="px-6 py-4 text-sm font-mono font-medium text-slate-700 tracking-tighter">900/0{i + 12}/414.420.0{i + 1}/2026</td>
                                    <td className="px-6 py-4 text-sm font-normal text-slate-700 uppercase">{villages[i]}</td>
                                    <td className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-tight font-normal">1{i} Feb 2026</td>
                                    <td className="px-6 py-4 text-sm font-mono text-right text-blue-600 font-bold">
                                        Rp {(15400000 + (i * 2500000)).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <ActionButtons />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuratMasuk;
