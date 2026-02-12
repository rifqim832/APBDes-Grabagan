import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import logo from '../assets/logo.png';

const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login gagal');
            }

            // Simpan ke localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            onLogin(data.user, data.token);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl mb-5">
                        <img
                            src={logo}
                            alt="Logo Kabupaten Tuban"
                            className="w-14 h-14 object-contain"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/56?text=TUBAN'; }}
                        />
                    </div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">SMART-APBDes</h1>
                    <p className="text-sm text-blue-200/60 mt-1 font-medium">Kecamatan Grabagan — Kabupaten Tuban</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/[0.07] backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-black/20 p-8">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-white">Masuk ke Sistem</h2>
                        <p className="text-xs text-blue-200/40 mt-1">Gunakan akun yang telah terdaftar</p>
                    </div>

                    {error && (
                        <div className="mb-5 flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-[10px] font-bold text-blue-200/50 uppercase tracking-[0.2em] block mb-2">Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/30" size={18} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Masukkan username"
                                    className="w-full bg-white/[0.06] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-blue-200/50 uppercase tracking-[0.2em] block mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/30" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan password"
                                    className="w-full bg-white/[0.06] border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/30 hover:text-blue-300/60 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Memproses...
                                </>
                            ) : (
                                'Masuk'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-[10px] text-blue-200/20 mt-6 font-medium tracking-wider">
                    SMART-APBDes v1.0 — System Monitoring & Administration of Recommendation Terpadu - APBDes
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
