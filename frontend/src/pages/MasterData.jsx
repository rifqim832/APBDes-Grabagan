import React, { useState, useEffect } from 'react';
import { Edit, Check, X, Save, Building2, UserCircle2 } from 'lucide-react';
import { getDesa, updateVillage, getOfficial, updateOfficial } from '../services/api';

const MasterData = () => {
    const [subTab, setSubTab] = useState('desa');
    const [villages, setVillages] = useState([]);
    const [official, setOfficial] = useState(null);

    // Edit states for villages
    const [editingVillageId, setEditingVillageId] = useState(null);
    const [editHeadName, setEditHeadName] = useState("");

    // Edit state for official
    const [editingOfficial, setEditingOfficial] = useState(false);
    const [officialForm, setOfficialForm] = useState({ name: "", nip: "", status: "Definitif", rank: "" });

    // Toast / feedback
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchVillages();
        fetchOfficial();
    }, []);

    const fetchVillages = () => {
        getDesa()
            .then(data => setVillages(data))
            .catch(console.error);
    };

    const fetchOfficial = () => {
        getOfficial()
            .then(data => {
                setOfficial(data);
                setOfficialForm({
                    name: data.name,
                    nip: data.nip,
                    status: data.status,
                    rank: data.rank || "Pembina Tingkat I"
                });
            })
            .catch(console.error);
    };

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    // ========== VILLAGE EDIT HANDLERS ==========
    const startEditVillage = (village) => {
        setEditingVillageId(village.id);
        setEditHeadName(village.headName || "");
    };

    const cancelEditVillage = () => {
        setEditingVillageId(null);
        setEditHeadName("");
    };

    const saveVillageHeadName = async (villageId) => {
        try {
            await updateVillage(villageId, { headName: editHeadName });
            setEditingVillageId(null);
            fetchVillages();
            showToast("✅ Nama Kepala Desa berhasil diperbarui");
        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan: " + error.message);
        }
    };

    // ========== OFFICIAL EDIT HANDLERS ==========
    const startEditOfficial = () => {
        setEditingOfficial(true);
        setOfficialForm({
            name: official.name,
            nip: official.nip,
            status: official.status,
            rank: official.rank || "Pembina Tingkat I"
        });
    };

    const cancelEditOfficial = () => {
        setEditingOfficial(false);
    };

    const saveOfficial = async () => {
        try {
            const updated = await updateOfficial(official.id, officialForm);
            setOfficial(updated);
            setEditingOfficial(false);
            showToast("✅ Data Camat berhasil diperbarui");
        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan: " + error.message);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-normal relative">
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl shadow-emerald-500/30 font-bold text-sm animate-in slide-in-from-top-2 duration-300 border border-emerald-400">
                    {toast}
                </div>
            )}

            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase font-normal">Master Data Kontrol</h2>

            {/* Sub-Tab Switcher */}
            <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit shadow-inner border border-slate-200 font-normal">
                <button
                    onClick={() => setSubTab('desa')}
                    className={`px-8 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all font-normal flex items-center gap-2 ${subTab === 'desa' ? 'bg-white text-blue-600 shadow-md border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}>
                    <Building2 size={14} /> Daftar Desa
                </button>
                <button
                    onClick={() => setSubTab('pejabat')}
                    className={`px-8 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all font-normal flex items-center gap-2 ${subTab === 'pejabat' ? 'bg-white text-blue-600 shadow-md border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}>
                    <UserCircle2 size={14} /> Struktur Pejabat
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm font-normal">
                {/* ==================== DAFTAR DESA ==================== */}
                {subTab === 'desa' ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">Klik tombol <span className="font-bold text-blue-600">Sunting</span> untuk mengubah Nama Kepala Desa. Data ini digunakan di preview surat.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-normal">
                            {villages.map(v => (
                                <div key={v.id} className="border border-slate-100 rounded-[1.5rem] p-6 hover:shadow-xl hover:border-blue-200 transition-all bg-slate-50/50 group font-normal">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-extrabold text-slate-800 uppercase tracking-tight text-base group-hover:text-blue-600 transition-colors font-normal">Desa {v.name}</h4>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 font-normal">Kode: {v.villageCode}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{v.address || "-"}</p>
                                            {v.email && <p className="text-[10px] text-blue-500 mt-0.5">{v.email}</p>}
                                        </div>
                                        {editingVillageId !== v.id && (
                                            <button
                                                onClick={() => startEditVillage(v)}
                                                className="p-2.5 bg-white rounded-xl text-slate-400 hover:text-blue-600 shadow-sm border border-slate-100 hover:scale-110 transition-all duration-300 font-normal"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Kepala Desa Edit / Display */}
                                    {editingVillageId === v.id ? (
                                        <div className="space-y-3 animate-in fade-in duration-200">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Nama Kepala Desa</label>
                                            <input
                                                type="text"
                                                value={editHeadName}
                                                onChange={(e) => setEditHeadName(e.target.value)}
                                                placeholder="Masukkan nama kepala desa..."
                                                className="w-full border border-blue-300 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                                autoFocus
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => saveVillageHeadName(v.id)}
                                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95"
                                                >
                                                    <Check size={14} /> Simpan
                                                </button>
                                                <button
                                                    onClick={cancelEditVillage}
                                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-2 border-t border-slate-100 pt-3">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Kepala Desa</p>
                                            <p className={`text-sm font-semibold ${v.headName ? 'text-slate-800' : 'text-slate-300 italic'}`}>
                                                {v.headName || "Belum diisi"}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* ==================== STRUKTUR PEJABAT ==================== */
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">Data pejabat ini digunakan sebagai penanda tangan di seluruh Surat Rekomendasi (Surat Keluar).</p>
                        </div>

                        {official && (
                            <div className="max-w-2xl mx-auto">
                                <div className="bg-slate-50/50 p-10 rounded-[2rem] flex flex-col items-center gap-8 border-2 border-slate-100 group hover:border-blue-300 transition-all font-normal">
                                    {/* Avatar */}
                                    <div className="w-24 h-24 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500 font-normal">
                                        {official.status === "Plt." ? "P" : "C"}
                                    </div>

                                    {editingOfficial ? (
                                        /* ===== EDIT MODE ===== */
                                        <div className="w-full space-y-5 animate-in fade-in duration-200">
                                            {/* Status */}
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Status Jabatan</label>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setOfficialForm(f => ({ ...f, status: "Definitif" }))}
                                                        className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border-2 ${officialForm.status === "Definitif"
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                                                            : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}
                                                    >
                                                        Definitif
                                                    </button>
                                                    <button
                                                        onClick={() => setOfficialForm(f => ({ ...f, status: "Plt." }))}
                                                        className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border-2 ${officialForm.status === "Plt."
                                                            ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20'
                                                            : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'}`}
                                                    >
                                                        Plt. (Pelaksana Tugas)
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Nama */}
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Nama Lengkap (dengan gelar)</label>
                                                <input
                                                    type="text"
                                                    value={officialForm.name}
                                                    onChange={(e) => setOfficialForm(f => ({ ...f, name: e.target.value }))}
                                                    placeholder="Contoh: H. SUWANTO, S.STP, M.M"
                                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold"
                                                />
                                            </div>

                                            {/* Pangkat */}
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Pangkat / Golongan</label>
                                                <input
                                                    type="text"
                                                    value={officialForm.rank}
                                                    onChange={(e) => setOfficialForm(f => ({ ...f, rank: e.target.value }))}
                                                    placeholder="Contoh: Pembina Tingkat I"
                                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                                />
                                            </div>

                                            {/* NIP */}
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">NIP</label>
                                                <input
                                                    type="text"
                                                    value={officialForm.nip}
                                                    onChange={(e) => setOfficialForm(f => ({ ...f, nip: e.target.value }))}
                                                    placeholder="Contoh: 19780101 200501 1 012"
                                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono"
                                                />
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-3 pt-4">
                                                <button
                                                    onClick={saveOfficial}
                                                    className="flex-1 bg-blue-600 text-white px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                                                >
                                                    <Save size={16} /> Simpan Perubahan
                                                </button>
                                                <button
                                                    onClick={cancelEditOfficial}
                                                    className="px-6 py-3.5 rounded-xl border-2 border-slate-200 text-slate-500 hover:bg-slate-100 font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
                                                >
                                                    Batal
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* ===== VIEW MODE ===== */
                                        <>
                                            <div className="text-center font-normal space-y-2">
                                                {official.status === "Plt." && (
                                                    <span className="inline-block bg-amber-100 text-amber-700 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-200 mb-2">
                                                        Plt. (Pelaksana Tugas)
                                                    </span>
                                                )}
                                                <h4 className="font-extrabold text-slate-900 uppercase text-lg leading-tight tracking-tight font-normal">{official.name}</h4>
                                                <p className="text-xs text-blue-600 font-bold italic tracking-wide uppercase tracking-widest font-normal">
                                                    {official.status === "Plt." ? "Plt. " : ""}{official.title}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium font-normal">{official.rank}</p>
                                                <p className="text-[10px] font-mono font-bold text-slate-400 mt-4 tracking-widest bg-white px-4 py-2 rounded-full shadow-inner border border-slate-100 font-normal">NIP. {official.nip}</p>
                                            </div>

                                            {/* Preview Banner */}
                                            <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                                                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-1">Preview di Surat Keluar</p>
                                                <p className="font-bold text-slate-700 text-sm">
                                                    {official.status === "Plt." ? "Plt. " : ""}Camat Grabagan
                                                </p>
                                                <div className="h-4"></div>
                                                <p className="font-bold underline text-sm uppercase tracking-tighter">{official.name}</p>
                                                <p className="text-[10px] text-slate-500">{official.rank}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">NIP. {official.nip}</p>
                                            </div>

                                            <button
                                                onClick={startEditOfficial}
                                                className="bg-white border-2 border-slate-100 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-95 font-normal flex items-center gap-2"
                                            >
                                                <Edit size={14} /> Sunting Data
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MasterData;
