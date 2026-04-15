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
    const [loadingStats, setLoadingStats] = useState(true);
    const [backupLoading, setBackupLoading] = useState(false);
    const [backupSuccess, setBackupSuccess] = useState(false);

    // Preferences state
    const [preferences, setPreferences] = useState({
        instanceName: localStorage.getItem('pref_instanceName') || 'Kantor Kecamatan Grabagan',
        countyName: localStorage.getItem('pref_countyName') || 'Kabupaten Tuban',
        address: localStorage.getItem('pref_address') || 'Jl. Raya Grabagan No. 01',
        postalCode: localStorage.getItem('pref_postalCode') || '62371',
        email: localStorage.getItem('pref_email') || 'kec.grabagan@tuban.go.id'
    });
    const [prefSaving, setPrefSaving] = useState(false);
    const [prefSuccess, setPrefSuccess] = useState(false);

    // Password state
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const data = await getDbStats();
            setDbStats(data);
        } catch (error) {
            console.error("Gagal fetch stats:", error);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleBackup = async () => {
        setBackupLoading(true);
        setBackupSuccess(false);
        try {
            await downloadBackup();
            setBackupSuccess(true);
            setTimeout(() => setBackupSuccess(false), 4000);
        } catch (error) {
            alert("Gagal membuat backup: " + error.message);
        } finally {
            setBackupLoading(false);
        }
    };

    const handleSavePreferences = () => {
        setPrefSaving(true);
        Object.entries(preferences).forEach(([key, value]) => {
            localStorage.setItem(`pref_${key}`, value);
        });
        setTimeout(() => {
            setPrefSaving(false);
            setPrefSuccess(true);
            setTimeout(() => setPrefSuccess(false), 3000);
        }, 500);
    };

    const handleChangePassword = async () => {
        setPasswordMsg({ type: '', text: '' });
        if (passwordData.newPassword.length < 6) {
            setPasswordMsg({ type: 'error', text: 'Password baru minimal 6 karakter' });
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMsg({ type: 'error', text: 'Konfirmasi password tidak cocok' });
            return;
        }
        setPasswordLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3000/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal mengubah password');
            setPasswordMsg({ type: 'success', text: data.message });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setPasswordMsg({ type: 'error', text: error.message });
        } finally {
            setPasswordLoading(false);
        }
    };

    // Sub-section: Identitas & Kop Surat
    if (activeSection === 'identity') {
        return (
            <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 font-normal">
                <button
                    onClick={() => setActiveSection(null)}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
                >
                    <ArrowLeft size={16} /> Kembali ke Pengaturan
                </button>

                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-xl"><Building className="text-blue-600" size={22} /></div>
                        Identitas & Kop Surat
                    </h2>
                    <p className="text-sm text-slate-400 mt-1 ml-12">Informasi instansi yang ditampilkan pada kop surat</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {[
                            { label: 'Nama Instansi', key: 'instanceName', icon: <Building size={16} />, placeholder: 'Kantor Kecamatan Grabagan' },
                            { label: 'Nama Kabupaten', key: 'countyName', icon: <Info size={16} />, placeholder: 'Kabupaten Tuban' },
                            { label: 'Alamat Kantor', key: 'address', icon: <Mail size={16} />, placeholder: 'Jl. Raya Grabagan No. 01' },
                            { label: 'Kode Pos', key: 'postalCode', icon: <Calendar size={16} />, placeholder: '62371' },
                            { label: 'Email Kantor', key: 'email', icon: <Mail size={16} />, placeholder: 'kec.grabagan@tuban.go.id' }
                        ].map((field) => (
                            <div key={field.key} className="p-5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span className="text-slate-300">{field.icon}</span> {field.label}
                                </label>
                                <input
                                    type="text"
                                    value={preferences[field.key]}
                                    onChange={(e) => setPreferences(prev => ({ ...prev, [field.key]: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    placeholder={field.placeholder}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        {prefSuccess && (
                            <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                                <CheckCircle2 size={16} /> Berhasil disimpan
                            </span>
                        )}
                        {!prefSuccess && <span />}
                        <button
                            onClick={handleSavePreferences}
                            disabled={prefSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all font-bold text-sm active:scale-95 disabled:opacity-50"
                        >
                            {prefSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {prefSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Sub-section: Keamanan Akun
    if (activeSection === 'security') {
        return (
            <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 font-normal">
                <button
                    onClick={() => setActiveSection(null)}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
                >
                    <ArrowLeft size={16} /> Kembali ke Pengaturan
                </button>

                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-xl"><Lock className="text-amber-600" size={22} /></div>
                        Keamanan Akun
                    </h2>
                    <p className="text-sm text-slate-400 mt-1 ml-12">Ubah password untuk keamanan akun Anda</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {[
                            { label: 'Password Saat Ini', key: 'currentPassword', showKey: 'current' },
                            { label: 'Password Baru', key: 'newPassword', showKey: 'new' },
                            { label: 'Konfirmasi Password Baru', key: 'confirmPassword', showKey: 'confirm' }
                        ].map((field) => (
                            <div key={field.key} className="p-5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                    {field.label}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords[field.showKey] ? 'text' : 'password'}
                                        value={passwordData[field.key]}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm font-medium text-slate-800 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, [field.showKey]: !prev[field.showKey] }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPasswords[field.showKey] ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {passwordMsg.text && (
                        <div className={`mx-5 mb-3 px-4 py-3 rounded-xl text-sm font-medium ${passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {passwordMsg.text}
                        </div>
                    )}

                    <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={handleChangePassword}
                            disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all font-bold text-sm active:scale-95 disabled:opacity-50"
                        >
                            {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                            {passwordLoading ? 'Mengubah...' : 'Ubah Password'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main Settings view
    return (
        <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-normal">
            {/* Preferensi Sistem */}
            <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase mb-8 font-normal">Preferensi Sistem</h2>
                <div className="bg-white border-2 border-slate-100 rounded-[2rem] divide-y divide-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden font-normal">
                    {/* Identitas & Kop Surat */}
                    <div
                        onClick={() => setActiveSection('identity')}
                        className="p-8 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group active:bg-slate-100 font-normal"
                    >
                        <div>
                            <h3 className="font-bold text-slate-800 tracking-tight font-normal">Identitas & Kop Surat</h3>
                            <p className="text-xs text-slate-400 mt-1 font-normal">Atur nama instansi, alamat, dan informasi kop surat</p>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" size={20} />
                    </div>

                    {/* Keamanan Akun */}
                    <div
                        onClick={() => setActiveSection('security')}
                        className="p-8 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group active:bg-slate-100 font-normal"
                    >
                        <div>
                            <h3 className="font-bold text-slate-800 tracking-tight font-normal">Keamanan Akun</h3>
                            <p className="text-xs text-slate-400 mt-1 font-normal">Ubah password dan keamanan akun</p>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" size={20} />
                    </div>

                    {/* Basis Data Aktif */}
                    <div className="p-8 font-normal">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-slate-800 tracking-tight font-normal">Basis Data Aktif</h3>
                                <p className="text-xs text-slate-400 mt-1 font-normal">Statistik dan informasi database</p>
                            </div>
                            <div className="p-2 bg-violet-50 rounded-xl">
                                <Database className="text-violet-600" size={18} />
                            </div>
                        </div>

                        {loadingStats ? (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Loader2 size={14} className="animate-spin" /> Memuat statistik...
                            </div>
                        ) : dbStats ? (
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Surat Keluar', value: dbStats.counts.outgoingLetters, icon: <FileText size={14} />, color: 'text-blue-600 bg-blue-50' },
                                    { label: 'Surat Masuk', value: dbStats.counts.incomingLetters, icon: <MailWarning size={14} />, color: 'text-emerald-600 bg-emerald-50' },
                                    { label: 'SPM Entries', value: dbStats.counts.spmEntries, icon: <FileSpreadsheet size={14} />, color: 'text-violet-600 bg-violet-50' },
                                    { label: 'Pengguna', value: dbStats.counts.users, icon: <Users size={14} />, color: 'text-amber-600 bg-amber-50' }
                                ].map((stat) => (
                                    <div key={stat.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className={`p-1.5 rounded-lg ${stat.color}`}>{stat.icon}</div>
                                        <div>
                                            <p className="text-lg font-extrabold text-slate-800">{stat.value}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="col-span-2 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="p-1.5 rounded-lg text-slate-600 bg-slate-100"><HardDrive size={14} /></div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{dbStats.dbSizeFormatted}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ukuran Database</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400">Gagal memuat statistik</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Pemeliharaan Arsip */}
            <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase mb-8 font-normal">Pemeliharaan Arsip</h2>
                <div className="bg-white border-2 border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden font-normal">
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-50 rounded-xl">
                                <Download className="text-emerald-600" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 tracking-tight font-normal">Cadangan Data</h3>
                                <p className="text-xs text-slate-400 mt-0.5 font-normal">Unduh seluruh data dalam format JSON</p>
                            </div>
                        </div>

                        {dbStats && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {[
                                    { label: 'Desa', count: dbStats.counts.villages },
                                    { label: 'Surat', count: dbStats.counts.outgoingLetters + dbStats.counts.incomingLetters },
                                    { label: 'SPM', count: dbStats.counts.spmEntries },
                                    { label: 'User', count: dbStats.counts.users }
                                ].map(item => (
                                    <span key={item.label} className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        {item.count} {item.label}
                                    </span>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={handleBackup}
                            disabled={backupLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {backupLoading ? (
                                <><Loader2 size={18} className="animate-spin" /> Memproses Backup...</>
                            ) : backupSuccess ? (
                                <><CheckCircle2 size={18} /> Backup Berhasil Diunduh!</>
                            ) : (
                                <><Download size={18} /> Unduh Cadangan Data (.JSON)</>
                            )}
                        </button>
                    </div>
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
