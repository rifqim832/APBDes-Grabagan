import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { getDesa } from '../services/api';

const MasterData = () => {
    const [subTab, setSubTab] = useState('desa');
    const [villages, setVillages] = useState([]);

    React.useEffect(() => {
        getDesa().then(data => setVillages(data.map(d => d.nama))).catch(console.error);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-normal">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase font-normal">Master Data Kontrol</h2>
            <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit shadow-inner border border-slate-200 font-normal">
                <button
                    onClick={() => setSubTab('desa')}
                    className={`px-8 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all font-normal ${subTab === 'desa' ? 'bg-white text-blue-600 shadow-md border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}>
                    Daftar Desa
                </button>
                <button
                    onClick={() => setSubTab('pejabat')}
                    className={`px-8 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all font-normal ${subTab === 'pejabat' ? 'bg-white text-blue-600 shadow-md border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}>
                    Struktur Pejabat
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm font-normal">
                {subTab === 'desa' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-normal">
                        {villages.map(v => (
                            <div key={v} className="border border-slate-100 rounded-[1.5rem] p-6 flex justify-between items-center hover:shadow-xl hover:border-blue-200 transition-all bg-slate-50/50 group active:scale-[0.98] font-normal">
                                <div>
                                    <h4 className="font-extrabold text-slate-800 uppercase tracking-tight text-base group-hover:text-blue-600 transition-colors font-normal">Desa {v}</h4>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 font-normal">Kec. Grabagan • Tuban</p>
                                </div>
                                <button className="p-3 bg-white rounded-xl text-slate-400 hover:text-blue-600 shadow-sm border border-slate-100 hover:scale-110 transition-all duration-300 font-normal"><Edit size={18} /></button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-normal">
                        <div className="bg-slate-50/50 p-8 rounded-[2rem] flex flex-col items-center gap-6 border-2 border-slate-100 group hover:border-blue-300 transition-all font-normal">
                            <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500 font-normal">C</div>
                            <div className="text-center font-normal">
                                <h4 className="font-extrabold text-slate-900 uppercase text-lg leading-tight tracking-tight font-normal">H. SUWANTO, S.STP, M.M</h4>
                                <p className="text-xs text-blue-600 font-bold italic tracking-wide mt-1 uppercase tracking-widest font-normal">Camat Grabagan</p>
                                <p className="text-[10px] font-mono font-bold text-slate-400 mt-4 tracking-widest bg-white px-4 py-2 rounded-full shadow-inner border border-slate-100 font-normal">NIP. 19780101 200501 1 012</p>
                            </div>
                            <button className="bg-white border-2 border-slate-100 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 font-normal">Sunting Data</button>
                        </div>
                        <div className="bg-slate-50/50 p-8 rounded-[2rem] flex flex-col items-center gap-6 border-2 border-slate-100 group hover:border-emerald-300 transition-all font-normal">
                            <div className="w-20 h-20 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500 font-normal">S</div>
                            <div className="text-center font-normal">
                                <h4 className="font-extrabold text-slate-900 uppercase text-lg leading-tight tracking-tight font-normal">AHMAD FAUZI, S.Sos</h4>
                                <p className="text-xs text-emerald-600 font-bold italic tracking-wide mt-1 uppercase tracking-widest font-normal">Sekretaris Kecamatan</p>
                                <p className="text-[10px] font-mono font-bold text-slate-400 mt-4 tracking-widest bg-white px-4 py-2 rounded-full shadow-inner border border-slate-100 font-normal">NIP. 19820512 201001 1 005</p>
                            </div>
                            <button className="bg-white border-2 border-slate-100 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 font-normal">Sunting Data</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MasterData;
