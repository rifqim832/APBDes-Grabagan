import React from 'react';
import { ChevronRight, MailWarning } from 'lucide-react';

const Settings = () => (
    <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-normal">
        <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase mb-8 font-normal">Preferensi Sistem</h2>
            <div className="bg-white border-2 border-slate-100 rounded-[2rem] divide-y divide-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden font-normal">
                <div className="p-8 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group active:bg-slate-100 font-normal">
                    <div>
                        <p className="font-extrabold text-slate-800 uppercase tracking-widest text-[10px] mb-1 font-normal">Identitas & Kop Surat</p>
                        <p className="text-sm text-slate-500 font-medium font-normal">Logo Tuban, Nama Instansi, dan Template Header.</p>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-blue-600 transition-all duration-300 group-hover:translate-x-1" />
                </div>
                <div className="p-8 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group active:bg-slate-100 font-normal">
                    <div>
                        <p className="font-extrabold text-slate-800 uppercase tracking-widest text-[10px] mb-1 font-normal">Keamanan Akun</p>
                        <p className="text-sm text-slate-500 font-medium font-normal">Kredensial administrator dan log akses sistem.</p>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-blue-600 transition-all duration-300 group-hover:translate-x-1" />
                </div>
                <div className="p-8 flex items-center justify-between bg-blue-50/30 font-normal">
                    <div>
                        <p className="font-extrabold text-blue-700 uppercase tracking-widest text-[10px] mb-1 font-normal">Basis Data Aktif</p>
                        <p className="text-sm text-slate-500 font-medium tracking-tight font-normal">Menentukan filter data arsip tahun anggaran berjalan.</p>
                    </div>
                    <div className="bg-blue-600 text-white px-5 py-2 rounded-2xl text-xs font-black shadow-xl shadow-blue-500/30 border border-blue-400 font-normal">2026</div>
                </div>
            </div>
        </div>

        <div className="p-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-[2.5rem] shadow-2xl shadow-orange-500/20 relative overflow-hidden group font-normal">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
            <h4 className="text-white font-extrabold uppercase tracking-widest flex items-center gap-3 relative z-10 text-sm font-normal">
                <MailWarning size={20} className="animate-pulse font-normal" /> Pemeliharaan Arsip
            </h4>
            <p className="text-orange-50 mt-3 font-medium relative z-10 leading-relaxed text-sm font-normal">Cadangkan database tahunan ke format terenkripsi untuk menjaga integritas data arsip digital Kecamatan Grabagan.</p>
            <button className="mt-8 bg-white text-orange-600 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all relative z-10 active:scale-95 font-normal">Unduh Cadangan Data (.SQL)</button>
        </div>
    </div>
);

export default Settings;
