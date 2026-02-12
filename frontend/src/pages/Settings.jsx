import React, { useState, useEffect } from 'react';
import {
    ChevronRight,
    MailWarning,
    Shield,
    Building,
    Database,
    Download,
    HardDrive,
    FileText,
    Users,
    CheckCircle2,
    Loader2,
    Eye,
    EyeOff,
    Save,
    X,
    ArrowLeft,
    Info,
    Calendar,
    Mail,
    FileSpreadsheet,
    BarChart3,
    Lock
} from 'lucide-react';
import { getDbStats, downloadBackup } from '../services/api';

const Settings = () => {
    const [activeSection, setActiveSection] = useState(null);
    const [dbStats, setDbStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [backupLoading, setBackupLoading] = useState(false);
    const [backupSuccess, setBackupSuccess] = useState(false);

    // Preferences state (stored in localStorage)
    const [preferences, setPreferences] = useState(() => {
        const saved = localStorage.getItem('siso_preferences');
        return saved ? JSON.parse(saved) : {
            instansiName: 'Kecamatan Grabagan',
            kabupatenName: 'Kabupaten Tuban',
            alamatKantor: 'Jl. Raya Grabagan',
            emailKantor: 'kecamatan.grabagan@gmail.com',
            kodePos: '62373',
            tahunAnggaran: new Date().getFullYear(),
            autoSaveInterval: 5, // minutes
            showNotifications: true,
            compactMode: false,
        };
    });

    const [editPrefs, setEditPrefs] = useState(null); // temporary edit state
    const [saving, setSaving] = useState(false);

    // Password change state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false, new: false, confirm: false
    });
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const stats = await getDbStats();
            setDbStats(stats);
        } catch (error) {
            console.error("Error fetching DB stats:", error);
        }
    };

    const handleSavePreferences = () => {
        setSaving(true);
        setTimeout(() => {
            setPreferences(editPrefs);
            localStorage.setItem('siso_preferences', JSON.stringify(editPrefs));
            setSaving(false);
            setActiveSection(null);
        }, 600);
    };

    const handleBackup = async () => {
        setBackupLoading(true);
        setBackupSuccess(false);
        try {
            await downloadBackup();
            setBackupSuccess(true);
            setTimeout(() => setBackupSuccess(false), 4000);
        } catch (error) {
            alert("Gagal mengunduh backup: " + error.message);
        } finally {
            setBackupLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        setPasswordMessage(null);

        if (!passwordForm.currentPassword || !passwordForm.newPassword) {
            setPasswordMessage({ type: 'error', text: 'Semua field harus diisi' });
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password baru minimal 6 karakter' });
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' });
            return;
        }

        setPasswordSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Gagal mengubah password');

            setPasswordMessage({ type: 'success', text: 'Password berhasil diubah!' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => {
                setPasswordMessage(null);
                setActiveSection(null);
            }, 2000);
        } catch (error) {
            setPasswordMessage({ type: 'error', text: error.message });
        } finally {
            setPasswordSaving(false);
        }
    };

    // ============ SUB SECTIONS ============

    // Identity & Letterhead section
    if (activeSection === 'identity') {
        const prefs = editPrefs || preferences;
        return (
            <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <button
                    onClick={() => { setActiveSection(null); setEditPrefs(null); }}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-bold transition-colors uppercase tracking-widest"
                >
                    <ArrowLeft size={16} /> Kembali ke Pengaturan
                </button>

                <div className="bg-white border-2 border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/30">
                                <Building size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight uppercase">Identitas & Kop Surat</h3>
                                <p className="text-sm text-slate-500 font-medium">Kelola informasi instansi yang tampil di kop surat.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Instansi</label>
                            <input
                                type="text"
                                value={prefs.instansiName}
                                onChange={e => setEditPrefs({ ...prefs, instansiName: e.target.value })}
                                className="w-full border-2 border-slate-100 px-5 py-3.5 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-700 bg-slate-50/50 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Kabupaten</label>
                            <input
                                type="text"
                                value={prefs.kabupatenName}
                                onChange={e => setEditPrefs({ ...prefs, kabupatenName: e.target.value })}
                                className="w-full border-2 border-slate-100 px-5 py-3.5 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-700 bg-slate-50/50 transition-all font-medium"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alamat Kantor</label>
                                <input
                                    type="text"
                                    value={prefs.alamatKantor}
                                    onChange={e => setEditPrefs({ ...prefs, alamatKantor: e.target.value })}
                                    className="w-full border-2 border-slate-100 px-5 py-3.5 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-700 bg-slate-50/50 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kode Pos</label>
                                <input
                                    type="text"
                                    value={prefs.kodePos}
                                    onChange={e => setEditPrefs({ ...prefs, kodePos: e.target.value })}
                                    className="w-full border-2 border-slate-100 px-5 py-3.5 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-700 bg-slate-50/50 transition-all font-medium"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Kantor</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    value={prefs.emailKantor}
                                    onChange={e => setEditPrefs({ ...prefs, emailKantor: e.target.value })}
                                    className="w-full border-2 border-slate-100 pl-12 pr-5 py-3.5 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-700 bg-slate-50/50 transition-all font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <button
                            onClick={() => { setActiveSection(null); setEditPrefs(null); }}
                            className="px-6 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSavePreferences}
                            disabled={saving}
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Security section
    if (activeSection === 'security') {
        return (
            <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <button
                    onClick={() => { setActiveSection(null); setPasswordMessage(null); }}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-bold transition-colors uppercase tracking-widest"
                >
                    <ArrowLeft size={16} /> Kembali ke Pengaturan
                </button>

                <div className="bg-white border-2 border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-red-50 to-orange-50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-600 rounded-2xl text-white shadow-lg shadow-red-500/30">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight uppercase">Keamanan Akun</h3>
                                <p className="text-sm text-slate-500 font-medium">Ubah password akun Anda.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        {passwordMessage && (
                            <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${passwordMessage.type === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {passwordMessage.type === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
                                {passwordMessage.text}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password Saat Ini</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showPasswords.current ? "text" : "password"}
                                    value={passwordForm.currentPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className="w-full border-2 border-slate-100 pl-12 pr-12 py-3.5 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none text-slate-700 bg-slate-50/50 transition-all font-medium"
                                    placeholder="Masukkan password saat ini"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password Baru</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showPasswords.new ? "text" : "password"}
                                    value={passwordForm.newPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="w-full border-2 border-slate-100 pl-12 pr-12 py-3.5 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none text-slate-700 bg-slate-50/50 transition-all font-medium"
                                    placeholder="Minimal 6 karakter"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Konfirmasi Password Baru</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showPasswords.confirm ? "text" : "password"}
                                    value={passwordForm.confirmPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className="w-full border-2 border-slate-100 pl-12 pr-12 py-3.5 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none text-slate-700 bg-slate-50/50 transition-all font-medium"
                                    placeholder="Ulangi password baru"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <button
                            onClick={() => { setActiveSection(null); setPasswordMessage(null); }}
                            className="px-6 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handlePasswordChange}
                            disabled={passwordSaving}
                            className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                        >
                            {passwordSaving ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                            {passwordSaving ? 'Menyimpan...' : 'Ubah Password'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ============ MAIN VIEW ============
    return (
        <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase mb-8">Preferensi Sistem</h2>
                <div className="bg-white border-2 border-slate-100 rounded-[2rem] divide-y divide-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                    {/* Identitas & Kop Surat */}
                    <div
                        onClick={() => { setActiveSection('identity'); setEditPrefs({ ...preferences }); }}
                        className="p-8 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group active:bg-slate-100"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <Building size={20} />
                            </div>
                            <div>
                                <p className="font-extrabold text-slate-800 uppercase tracking-widest text-[10px] mb-1">Identitas & Kop Surat</p>
                                <p className="text-sm text-slate-500 font-medium">{preferences.instansiName} — {preferences.kabupatenName}</p>
                            </div>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-blue-600 transition-all duration-300 group-hover:translate-x-1" />
                    </div>

                    {/* Keamanan Akun */}
                    <div
                        onClick={() => setActiveSection('security')}
                        className="p-8 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group active:bg-slate-100"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-all">
                                <Shield size={20} />
                            </div>
                            <div>
                                <p className="font-extrabold text-slate-800 uppercase tracking-widest text-[10px] mb-1">Keamanan Akun</p>
                                <p className="text-sm text-slate-500 font-medium">Ubah password dan kelola kredensial akun.</p>
                            </div>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-red-600 transition-all duration-300 group-hover:translate-x-1" />
                    </div>

                    {/* Basis Data Aktif */}
                    <div className="p-8 flex items-center justify-between bg-blue-50/30">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="font-extrabold text-blue-700 uppercase tracking-widest text-[10px] mb-1">Basis Data Aktif</p>
                                <p className="text-sm text-slate-500 font-medium tracking-tight">Filter data arsip tahun anggaran berjalan.</p>
                            </div>
                        </div>
                        <div className="bg-blue-600 text-white px-5 py-2 rounded-2xl text-xs font-black shadow-xl shadow-blue-500/30 border border-blue-400">{new Date().getFullYear()}</div>
                    </div>
                </div>
            </div>

            {/* Database Statistics */}
            {dbStats && (
                <div className="bg-white border-2 border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                                <HardDrive size={20} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-[10px] uppercase tracking-widest">Statistik Database</h3>
                                <p className="text-xs text-slate-400 font-medium">SQLite — {dbStats.dbSizeFormatted}</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100">
                        <div className="bg-white p-5 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-2">
                                <FileText size={14} className="text-blue-500" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Surat Keluar</span>
                            </div>
                            <p className="text-2xl font-black text-slate-800">{dbStats.counts.outgoingLetters}</p>
                        </div>
                        <div className="bg-white p-5 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-2">
                                <Mail size={14} className="text-emerald-500" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Surat Masuk</span>
                            </div>
                            <p className="text-2xl font-black text-slate-800">{dbStats.counts.incomingLetters}</p>
                        </div>
                        <div className="bg-white p-5 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-2">
                                <FileSpreadsheet size={14} className="text-violet-500" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SPM Entry</span>
                            </div>
                            <p className="text-2xl font-black text-slate-800">{dbStats.counts.spmEntries}</p>
                        </div>
                        <div className="bg-white p-5 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-2">
                                <Users size={14} className="text-amber-500" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pengguna</span>
                            </div>
                            <p className="text-2xl font-black text-slate-800">{dbStats.counts.users}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Backup Section */}
            <div className="p-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-[2.5rem] shadow-2xl shadow-orange-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-10 -mb-10"></div>

                <div className="relative z-10">
                    <h4 className="text-white font-extrabold uppercase tracking-widest flex items-center gap-3 text-sm">
                        <Database size={20} className="animate-pulse" /> Pemeliharaan Arsip
                    </h4>
                    <p className="text-orange-50 mt-3 font-medium leading-relaxed text-sm">
                        Unduh cadangan lengkap seluruh database sistem — termasuk data surat masuk, surat keluar, SPM, data desa, dan pagu anggaran dalam format JSON.
                    </p>

                    {dbStats && (
                        <div className="mt-5 flex flex-wrap gap-3">
                            <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                {dbStats.counts.outgoingLetters + dbStats.counts.incomingLetters} Surat
                            </span>
                            <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                {dbStats.counts.spmEntries} SPM Entries
                            </span>
                            <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                {dbStats.counts.villages} Desa
                            </span>
                            <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                DB: {dbStats.dbSizeFormatted}
                            </span>
                        </div>
                    )}

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <button
                            onClick={handleBackup}
                            disabled={backupLoading}
                            className="bg-white text-orange-600 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70"
                        >
                            {backupLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : backupSuccess ? (
                                <CheckCircle2 size={16} className="text-emerald-600" />
                            ) : (
                                <Download size={16} />
                            )}
                            {backupLoading ? 'Memproses...' : backupSuccess ? 'Berhasil Diunduh!' : 'Unduh Cadangan Data (.JSON)'}
                        </button>
                    </div>

                    {backupSuccess && (
                        <p className="mt-4 text-orange-100 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
                            <CheckCircle2 size={14} /> File backup berhasil diunduh. Simpan di lokasi yang aman.
                        </p>
                    )}
                </div>
            </div>

            {/* App Version Footer */}
            <div className="text-center py-4">
                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em]">
                    SMART-APBDes Grabagan v1.0.0 — {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
};

export default Settings;
