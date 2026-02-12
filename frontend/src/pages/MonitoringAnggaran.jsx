import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Edit3, Save, X, ChevronDown } from 'lucide-react';
import { getDesa, getMonitoringAnggaran, upsertPagu, getAvailableYears } from '../services/api';

const MonitoringAnggaran = () => {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [monitoringData, setMonitoringData] = useState(null);
    const [villages, setVillages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [availableYears, setAvailableYears] = useState([]);
    const [initialized, setInitialized] = useState(false);

    // Edit pagu state
    const [editingVillageId, setEditingVillageId] = useState(null);
    const [editAmount, setEditAmount] = useState("");

    // On mount: fetch available years and auto-select
    useEffect(() => {
        const init = async () => {
            try {
                const years = await getAvailableYears();
                setAvailableYears(years);
                // If current year has no data but other years do, auto-select the most recent year with data
                if (years.length > 0 && !years.includes(currentYear)) {
                    setYear(years[0]); // Most recent year with data
                }
            } catch (error) {
                console.error("Gagal mengambil tahun tersedia:", error);
            } finally {
                setInitialized(true);
            }
        };
        init();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [villageData, monitoring] = await Promise.all([
                getDesa(),
                getMonitoringAnggaran(year)
            ]);
            setVillages(villageData);
            setMonitoringData(monitoring);
        } catch (error) {
            console.error("Gagal mengambil data monitoring:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialized) fetchData();
    }, [year, initialized]);

    const handleSavePagu = async (villageId) => {
        try {
            await upsertPagu({
                villageId,
                year,
                amount: parseFloat(editAmount.replace(/\./g, '').replace(/,/g, '.')) || 0
            });
            setEditingVillageId(null);
            setEditAmount("");
            fetchData();
        } catch (error) {
            alert("Gagal menyimpan pagu: " + error.message);
        }
    };

    const startEdit = (villageId, currentAmount) => {
        setEditingVillageId(villageId);
        setEditAmount(currentAmount > 0 ? currentAmount.toLocaleString('id-ID') : "");
    };

    const getStatusColor = (persentase) => {
        if (persentase >= 100) return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-200' };
        if (persentase >= 75) return { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200' };
        if (persentase >= 50) return { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-200' };
        return { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' };
    };

    const getStatusLabel = (persentase) => {
        if (persentase >= 100) return 'Melebihi Pagu';
        if (persentase >= 75) return 'Hampir Penuh';
        if (persentase >= 50) return 'Sedang';
        if (persentase > 0) return 'Aman';
        return 'Belum Ada';
    };

    const formatRupiah = (num) => `Rp ${Number(num || 0).toLocaleString('id-ID')}`;

    // Build year options from available years + range around current year
    const yearOptionsSet = new Set();
    for (let y = currentYear - 2; y <= currentYear + 1; y++) {
        yearOptionsSet.add(y);
    }
    availableYears.forEach(y => yearOptionsSet.add(y));
    const yearOptions = [...yearOptionsSet].sort((a, b) => b - a);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    const villageResults = monitoringData?.villages || [];
    const grandTotal = monitoringData?.grandTotal || {};

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-600 rounded-xl text-white shadow-lg shadow-violet-600/20">
                        <BarChart3 size={22} />
                    </div>
                    <div>
                        <h2 className="text-xl font-extrabold tracking-tight text-slate-800">Monitoring Pagu Dana Desa</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Pantau realisasi anggaran desa terhadap pagu yang ditetapkan</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tahun Anggaran</span>
                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="border-slate-200 border rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 font-bold text-slate-700 text-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-10 transition-all min-w-[120px]"
                    >
                        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Grand Total Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pagu</p>
                    <p className="text-lg font-extrabold text-slate-800 tracking-tight">{formatRupiah(grandTotal.totalPagu)}</p>
                    <p className="text-[10px] text-slate-400 mt-1">11 Desa Kec. Grabagan</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Total Realisasi</p>
                    <p className="text-lg font-extrabold text-blue-600 tracking-tight">{formatRupiah(grandTotal.totalRealisasi)}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{grandTotal.totalSurat || 0} surat — {grandTotal.totalSpm || 0} SPM entry</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Sisa Anggaran</p>
                    <p className="text-lg font-extrabold text-emerald-600 tracking-tight">{formatRupiah(grandTotal.totalSisa)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">Persentase</p>
                    <p className="text-lg font-extrabold text-violet-600 tracking-tight">{grandTotal.persentase || 0}%</p>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                        <div
                            className="h-2 rounded-full bg-violet-500 transition-all duration-700"
                            style={{ width: `${Math.min(grandTotal.persentase || 0, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Village Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {villageResults.map((item) => {
                    const status = getStatusColor(item.persentase);
                    const isEditing = editingVillageId === item.villageId;

                    return (
                        <div
                            key={item.villageId}
                            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${item.persentase >= 100 ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'}`}
                        >
                            {/* Card Header */}
                            <div className="p-5 pb-3">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-extrabold text-slate-800 text-base uppercase tracking-tight">Desa {item.namaDesa}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-0.5">{item.kodeDesa}</p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${status.light} ${status.text} ${status.border} border`}>
                                        {getStatusLabel(item.persentase)}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-3">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Realisasi</span>
                                        <span className={`text-sm font-extrabold ${status.text}`}>{item.persentase}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3">
                                        <div
                                            className={`h-3 rounded-full ${status.bg} transition-all duration-700 ease-out`}
                                            style={{ width: `${Math.min(item.persentase, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Pagu Section */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Pagu Dana</span>
                                        {isEditing ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-slate-400">Rp</span>
                                                <input
                                                    type="text"
                                                    value={editAmount}
                                                    onChange={(e) => setEditAmount(e.target.value)}
                                                    placeholder="0"
                                                    className="w-36 border border-violet-300 rounded-lg px-2 py-1 text-right text-sm font-mono focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSavePagu(item.villageId)}
                                                />
                                                <button onClick={() => handleSavePagu(item.villageId)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                                                    <Save size={14} />
                                                </button>
                                                <button onClick={() => setEditingVillageId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg transition-all">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                <span className={`font-bold font-mono ${item.pagu > 0 ? 'text-slate-800' : 'text-slate-300 italic'}`}>
                                                    {item.pagu > 0 ? formatRupiah(item.pagu) : 'Belum diatur'}
                                                </span>
                                                <button
                                                    onClick={() => startEdit(item.villageId, item.pagu)}
                                                    className="p-1 text-slate-300 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                                                    title="Edit Pagu"
                                                >
                                                    <Edit3 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-500 font-medium">Realisasi</span>
                                        <span className="font-bold font-mono text-blue-600">{formatRupiah(item.realisasi)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-violet-500 font-medium">SPM Entry</span>
                                        <span className="font-bold font-mono text-violet-600">{item.jumlahSpm || 0} SPM</span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-100 pt-2">
                                        <span className="text-slate-400">Sisa Anggaran</span>
                                        <span className={`font-bold font-mono ${item.sisa < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {item.sisa < 0 ? '- ' : ''}{formatRupiah(Math.abs(item.sisa))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-[10px] text-slate-400">{item.jumlahSurat} surat — {item.jumlahSpm || 0} SPM</span>
                                {item.persentase >= 90 && item.persentase < 100 && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                                        <AlertTriangle size={12} /> Hampir penuh
                                    </span>
                                )}
                                {item.persentase >= 100 && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-600">
                                        <AlertTriangle size={12} /> Melebihi pagu!
                                    </span>
                                )}
                                {item.persentase > 0 && item.persentase < 90 && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                        <CheckCircle2 size={12} /> Normal
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tabel Ringkasan */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <TrendingUp size={18} className="text-violet-600" />
                        Tabel Ringkasan Realisasi Anggaran TA {year}
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-violet-600 text-white">
                                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-center w-12 border-r border-violet-500/30">No</th>
                                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest border-r border-violet-500/30">Nama Desa</th>
                                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-right border-r border-violet-500/30">Pagu Dana</th>
                                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-right border-r border-violet-500/30">Realisasi</th>
                                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-right border-r border-violet-500/30">Sisa</th>
                                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-center w-20 border-r border-violet-500/30">%</th>
                                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-center w-16 border-r border-violet-500/30">Surat</th>
                                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-center w-16">SPM</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {villageResults.map((item, i) => {
                                const status = getStatusColor(item.persentase);
                                return (
                                    <tr key={item.villageId} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 text-center text-xs font-semibold text-slate-400">{i + 1}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-slate-800 uppercase">{item.namaDesa}</td>
                                        <td className="px-4 py-3 text-sm text-right font-mono text-slate-600">{item.pagu > 0 ? formatRupiah(item.pagu) : '-'}</td>
                                        <td className="px-4 py-3 text-sm text-right font-mono font-bold text-blue-600">{formatRupiah(item.realisasi)}</td>
                                        <td className={`px-4 py-3 text-sm text-right font-mono font-bold ${item.sisa < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {item.sisa < 0 ? '-' : ''}{formatRupiah(Math.abs(item.sisa))}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${status.light} ${status.text}`}>
                                                {item.persentase}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm font-semibold text-slate-500">{item.jumlahSurat}</td>
                                        <td className="px-4 py-3 text-center text-sm font-semibold text-violet-500">{item.jumlahSpm || 0}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                                <td colSpan="2" className="px-4 py-3 text-sm uppercase tracking-widest text-center text-slate-600">Grand Total</td>
                                <td className="px-4 py-3 text-sm text-right font-mono text-slate-800">{formatRupiah(grandTotal.totalPagu)}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono text-blue-600">{formatRupiah(grandTotal.totalRealisasi)}</td>
                                <td className={`px-4 py-3 text-sm text-right font-mono ${grandTotal.totalSisa < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {grandTotal.totalSisa < 0 ? '-' : ''}{formatRupiah(Math.abs(grandTotal.totalSisa || 0))}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-violet-50 text-violet-600">
                                        {grandTotal.persentase || 0}%
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center text-sm text-slate-600">{grandTotal.totalSurat || 0}</td>
                                <td className="px-4 py-3 text-center text-sm font-bold text-violet-600">{grandTotal.totalSpm || 0}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MonitoringAnggaran;
