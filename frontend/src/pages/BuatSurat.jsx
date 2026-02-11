import React, { useState } from 'react';
import {
    CheckCircle2,
    FilePlus2,
    Building2,
    Calendar,
    Hash,
    Upload,
    FileText,
    Edit,
    Download,
    Printer,
    ArrowLeft,
    ArrowRight,
    Plus
} from 'lucide-react';

import { getDesa, uploadExcel, createLetters, getLastSuratNumber, getOfficial } from '../services/api';
import logo from '../assets/logo.png';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

const BuatSurat = ({ logoUrl }) => {
    const [villages, setVillages] = useState([]);
    const [allVillages, setAllVillages] = useState([]);
    const [step, setStep] = useState(1);
    const [official, setOfficial] = useState(null);

    React.useEffect(() => {
        const fetchDesa = async () => {
            try {
                const data = await getDesa();
                // Ensure data is array and map to names
                if (Array.isArray(data)) {
                    setAllVillages(data);
                    setVillages(data.map(d => d.name));
                }
            } catch (error) {
                console.error("Error fetching villages:", error);
            }
        };

        const fetchLastNumber = async () => {
            try {
                const res = await getLastSuratNumber();
                if (res && res.nextNumber) {
                    setOutgoingLetterNo(res.nextNumber);
                }
            } catch (error) {
                console.error("Error fetching last number:", error);
            }
        };

        fetchDesa();
        fetchLastNumber();
        getOfficial().then(setOfficial).catch(console.error);
    }, []);
    const [isParsing, setIsParsing] = useState(false);
    const [parsedData, setParsedData] = useState({ activities: [], totalBudget: 0 });

    const [selectedVillage, setSelectedVillage] = useState("");
    // Separate Auto-Increment (Outgoing) and Excel Reference (Incoming)
    const [outgoingLetterNo, setOutgoingLetterNo] = useState("001");
    const [incomingLetterNo, setIncomingLetterNo] = useState("");
    const [letterNature, setLetterNature] = useState("Penting");
    const [letterSubject, setLetterSubject] = useState("Pengantar Pencairan APBDes Desa [Nama Desa]");
    const [letterDate, setLetterDate] = useState(new Date().toISOString().split('T')[0]);

    React.useEffect(() => {
        if (selectedVillage && letterSubject.includes("[Nama Desa]")) {
            setLetterSubject(prev => prev.replace("[Nama Desa]", selectedVillage));
        }
    }, [selectedVillage]);

    const villageCodes = {
        "Banyubang": "414.420.05", "Dahor": "414.420.06", "Dermawuharjo": "414.420.08",
        "Gesikan": "414.420.02", "Grabagan": "414.420.01", "Menyunyur": "414.420.09",
        "Ngandong": "414.420.03", "Ngarum": "414.420.10", "Ngrejeng": "414.420.11",
        "Pakis": "414.420.07", "Waleran": "414.420.04"
    };
    const handleFileUpload = async (file) => {
        setIsParsing(true);
        try {
            const result = await uploadExcel(file);
            setParsedData(result.data);

            if (result.metadata) {
                if (result.metadata.desa) {
                    const foundVillage = Object.keys(villageCodes).find(v =>
                        v.toLowerCase() === result.metadata.desa.toLowerCase()
                    );
                    if (foundVillage) setSelectedVillage(foundVillage);
                }

                if (result.metadata.nomorSurat) {
                    const parts = result.metadata.nomorSurat.split('/');
                    if (parts.length > 1) {
                        const seq = parts[1].trim();
                        if (seq) setIncomingLetterNo(seq);
                    }
                }
            }

            setTimeout(() => {
                setIsParsing(false);
                setStep(3);
            }, 1000);
        } catch (error) {
            console.error(error);
            setIsParsing(false);
            // Handle specific backend error structure if available
            const errorMsg = error.message.includes("Server Error")
                ? error.message
                : error.message;
            alert(`Gagal mengunggah file: ${errorMsg}`);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const steps = [
        { id: 1, label: "Info Header" },
        { id: 2, label: "Sumber Data" },
        { id: 3, label: "Ekstraksi" },
        { id: 4, label: "Pratinjau" },
        { id: 5, label: "Selesai" }
    ];

    const simulateParsing = () => {
        setIsParsing(true);
        setTimeout(() => {
            setIsParsing(false);
            setStep(4);
        }, 2000);
    };

    const handleDownloadDocx = async () => {
        try {
            // Load template
            // Load template with cache busting to prevent stale 404s
            const response = await fetch(`/assets/template_surat_keluar.docx?t=${new Date().getTime()}`);

            if (!response.ok) {
                console.error("Template fetch failed:", response.status, response.statusText);
                throw new Error(`Template file not found at ${response.url} (Status: ${response.status})`);
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.toLowerCase().includes("text/html")) {
                throw new Error(`Template path returned HTML (likely 404 Page) instead of DOCX. Please ensure 'public/assets/template_surat_keluar.docx' exists.`);
            }

            const content = await response.arrayBuffer();
            if (content.byteLength === 0) {
                throw new Error("Template file is empty (0 bytes). Please replace 'public/assets/template_surat_keluar.docx' with a valid Word document.");
            }

            // Check signature (PK \x03 \x04)
            const view = new Uint8Array(content);
            if (view[0] !== 0x50 || view[1] !== 0x4B || view[2] !== 0x03 || view[3] !== 0x04) {
                console.warn("File signature mismatch! First 4 bytes:", view.slice(0, 4));
                // Throw to prevent PizZip confusing error
                throw new Error("File is corrupted or not a valid DOCX/Zip file (Invalid Signature).");
            }

            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

            // Format numbers for template
            const formattedActivities = parsedData.activities.map(item => ({
                ...item,
                anggaran: item.anggaran ? Number(item.anggaran).toLocaleString('id-ID') : "0"
            }));

            doc.render({
                nomor_surat: outgoingLetterNo,
                nomor_masuk: incomingLetterNo,
                sifat: letterNature,
                perihal: letterSubject,
                desa: selectedVillage,
                kode_desa: currentVillageCode,
                tahun: new Date(letterDate).getFullYear(),
                tanggal: new Date(letterDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }),
                spm_list: formattedActivities,
                total_budget: parsedData.totalBudget.toLocaleString('id-ID'),
                total_anggaran: parsedData.totalBudget.toLocaleString('id-ID'),
                status_camat: official?.status === "Plt." ? "Plt. " : "",
                nama_camat: official?.name || "H. SUWANTO, S.STP, M.M",
                pangkat_camat: official?.rank || "Pembina Tingkat I",
                nip_camat: official?.nip || "19780101 200501 1 012"
            });

            const out = doc.getZip().generate({
                type: "blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            saveAs(out, `Rekomendasi_Pencairan_${selectedVillage}_${new Date().toISOString().split('T')[0]}.docx`);
        } catch (error) {
            console.error(error);
            alert("Gagal mengunduh DOCX: " + error.message);
        }
    };

    const handleFinalize = async () => {
        try {
            // Find Village ID
            const desaObj = allVillages.find(v => v.name === selectedVillage);
            const villageId = desaObj ? desaObj.id : 1;

            // Archive to Database (Integrasi Data Transaksional)
            // Satu kali klik menyimpan: IncomingLetter + OutgoingLetter + SpmEntries
            await createLetters({
                referenceNo: incomingLetterNo,
                letterNo: outgoingLetterNo,
                subject: letterSubject,
                letterDate: letterDate,
                villageId: villageId,
                totalBudget: parsedData.totalBudget,
                activities: parsedData.activities
            });

            // Move to Final Step
            setStep(5);
        } catch (error) {
            console.error("Archive Error:", error);
            alert("Gagal mengarsipkan dokumen: " + error.message);
        }
    };

    const handlePrintOnly = () => {
        window.print();
    };

    const currentVillageCode = selectedVillage ? villageCodes[selectedVillage] : "414.420.XX";

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Stepper Modern */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between relative max-w-3xl mx-auto">
                    <div className="absolute top-[18px] left-0 w-full h-[2px] bg-slate-100 -z-0"></div>
                    <div className="absolute top-[18px] left-0 h-[2px] bg-blue-600 transition-all duration-700 -z-0" style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}></div>

                    {steps.map((s) => (
                        <div key={s.id} className="flex flex-col items-center gap-3 relative z-10">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border-2 transition-all duration-500 shadow-sm ${step >= s.id ? 'bg-blue-600 text-white border-blue-600 scale-110' : 'bg-white text-slate-300 border-slate-100'
                                }`}>
                                {step > s.id ? <CheckCircle2 size={20} /> : s.id}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-[0.1em] transition-colors duration-500 ${step >= s.id ? 'text-blue-600' : 'text-slate-300'}`}>{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                {step === 1 && (
                    <div className="p-10 space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                                    <FilePlus2 size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight font-normal">Informasi Kepala Surat</h3>
                                    <p className="text-slate-500 text-sm font-medium font-normal">Lengkapi identitas surat pemohon desa.</p>
                                </div>
                            </div>
                            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2">
                                <Hash size={14} className="opacity-50" />
                                <span className="font-mono text-xs font-bold uppercase font-normal">Kode: {currentVillageCode}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-normal">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 px-1 font-normal">Desa Pemohon</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                    <select
                                        className="w-full border-2 border-slate-100 pl-12 pr-10 py-3.5 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-normal text-slate-700 bg-slate-50/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_1rem_center] bg-no-repeat"
                                        value={selectedVillage}
                                        onChange={(e) => setSelectedVillage(e.target.value)}
                                    >
                                        <option value="">Pilih Desa...</option>
                                        {villages.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 px-1 font-normal">Tanggal Surat Rekomendasi</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                    <input
                                        type="date"
                                        className="w-full border-2 border-slate-100 pl-12 pr-5 py-3.5 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none font-normal text-slate-700 bg-slate-50/50 transition-all shadow-sm"
                                        value={letterDate}
                                        onChange={(e) => setLetterDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1 font-normal">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">No. Surat Permohonan</label>
                                    <span className="text-[9px] font-mono text-slate-400">FORMAT: 900/[URUT]/[KODE]/2026</span>
                                </div>
                                <div className="flex gap-3">
                                    <div className="bg-slate-100 border border-slate-200 px-4 py-3.5 rounded-2xl text-slate-500 font-mono font-semibold flex items-center font-normal">900/</div>
                                    <input
                                        type="text"
                                        placeholder="001"
                                        className="w-28 border-2 border-slate-100 p-3.5 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none text-center font-normal text-slate-800 bg-slate-50/50 transition-all shadow-sm"
                                        value={incomingLetterNo}
                                        onChange={(e) => setIncomingLetterNo(e.target.value)}
                                    />
                                    <div className="flex-1 bg-slate-100 border border-slate-200 px-4 py-3.5 rounded-2xl text-slate-400 font-mono text-[11px] font-bold flex items-center overflow-hidden whitespace-nowrap font-normal">
                                        /{currentVillageCode}/{new Date().getFullYear()}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 px-1 font-normal">Sifat Surat</label>
                                <select
                                    className="w-full border-2 border-slate-100 p-3.5 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none font-normal text-slate-700 bg-slate-50/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_1rem_center] bg-no-repeat transition-all shadow-sm"
                                    value={letterNature}
                                    onChange={(e) => setLetterNature(e.target.value)}
                                >
                                    <option value="Segera">Segera</option>
                                    <option value="Penting">Penting</option>
                                    <option value="Biasa">Biasa</option>
                                </select>
                            </div>

                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 px-1 font-normal">Perihal Rekomendasi</label>
                                <textarea
                                    className="w-full border-2 border-slate-100 p-5 rounded-2xl h-28 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none font-normal text-slate-700 bg-slate-50/50 transition-all shadow-sm resize-none"
                                    value={letterSubject}
                                    onChange={(e) => setLetterSubject(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="p-20 text-center space-y-10 font-normal">
                        <div className="max-w-xl mx-auto font-normal">
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase font-normal">Sumber Data</h3>
                            <p className="text-slate-500 font-medium mt-2">Unggah lampiran SPM desa dalam format Excel.</p>
                        </div>

                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => document.getElementById('fileInput').click()}
                            className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] p-20 flex flex-col items-center gap-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group active:scale-[0.98]">
                            <input
                                type="file"
                                id="fileInput"
                                className="hidden"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                            />
                            <div className="bg-white p-8 rounded-[2rem] shadow-xl text-blue-600 group-hover:scale-110 transition-transform duration-500 border border-slate-100 font-normal">
                                <Upload size={56} strokeWidth={2} />
                            </div>
                            <div className="space-y-2 font-normal">
                                <p className="text-xl font-bold text-slate-700 tracking-tight">Tarik & Lepas file ke sini</p>
                                <p className="text-sm text-slate-400 font-medium tracking-tight font-normal">atau klik untuk menelusuri penyimpanan lokal</p>
                            </div>
                            <div className="flex gap-3 pt-4 font-normal">
                                <span className="bg-white text-slate-400 px-4 py-2 rounded-full text-[10px] font-bold border border-slate-200 shadow-sm uppercase tracking-widest font-normal">Excel XLSX</span>
                                <span className="bg-white text-slate-400 px-4 py-2 rounded-full text-[10px] font-bold border border-slate-200 shadow-sm uppercase tracking-widest font-normal">Maks 10MB</span>
                            </div>
                        </div>

                        <button className="text-blue-600 font-bold text-sm hover:underline decoration-2 underline-offset-4 transition-all uppercase tracking-widest font-normal">Gunakan Input Manual</button>
                    </div>
                )}

                {step === 3 && (
                    <div className="p-24 flex flex-col items-center justify-center space-y-8 font-normal">
                        {isParsing ? (
                            <>
                                <div className="relative font-normal">
                                    <div className="w-28 h-28 border-[10px] border-slate-100 rounded-full shadow-inner"></div>
                                    <div className="absolute top-0 left-0 w-28 h-28 border-[10px] border-blue-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-500/20"></div>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-slate-800 tracking-tight animate-pulse uppercase font-normal">Mengekstrak Data...</p>
                                    <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto mt-2 leading-relaxed">Algoritma parser sedang mengidentifikasi nominal anggaran dan rincian kegiatan SPM desa.</p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center space-y-8 animate-in zoom-in-95 duration-500 font-normal">
                                <div className="bg-emerald-50 text-emerald-600 p-8 rounded-full w-32 h-32 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/10 border-8 border-white scale-110 font-normal">
                                    <CheckCircle2 size={64} />
                                </div>
                                <div className="space-y-3 font-normal">
                                    <h4 className="text-3xl font-black text-slate-800 tracking-tight uppercase font-normal">Sistem Siap</h4>
                                    <p className="text-slate-500 font-medium leading-relaxed max-w-md mx-auto">Sistem mendeteksi <span className="text-blue-600 font-extrabold">{parsedData.activities.length} baris kegiatan</span> dengan total anggaran sebesar <span className="text-slate-900 font-extrabold tracking-tight">Rp {parsedData.totalBudget.toLocaleString('id-ID')}</span>.</p>
                                </div>
                                <button onClick={() => setStep(4)} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-extrabold shadow-2xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 transition-all uppercase tracking-[0.15em] text-sm active:scale-95 font-normal">Lihat Pratinjau Surat</button>
                            </div>
                        )}
                    </div>
                )}

                {step === 4 && (
                    <div className="p-8 space-y-8 font-normal">
                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <div className="flex items-center gap-3 font-normal">
                                <FileText size={20} className="text-slate-400" />
                                <h3 className="font-extrabold uppercase tracking-[0.1em] text-slate-500 text-xs">Final Draft Pratinjau</h3>
                            </div>
                            <button className="text-blue-600 flex items-center gap-2 text-xs font-bold border-2 border-blue-100 px-5 py-2 rounded-xl bg-white hover:bg-blue-50 hover:border-blue-200 transition-all uppercase active:scale-95 font-normal">
                                <Edit size={16} /> Sunting Konten
                            </button>
                        </div>

                        <div className="bg-slate-200 p-10 rounded-3xl border-8 border-white shadow-inner flex justify-center overflow-x-auto">
                            {/* F4 Simulator - Updated to font-sans (Inter) */}
                            <div className="printable-area bg-white w-full max-w-[210mm] min-h-[330mm] p-[2.5cm] shadow-2xl text-[12px] space-y-6 relative text-black leading-snug font-sans box-border" style={{ fontFamily: "'Inter', sans-serif" }}>
                                {/* Kop Surat */}
                                <div className="flex items-center border-b-[4px] border-double border-black pb-2 mb-6">
                                    <img src={logo} alt="Logo" className="w-24 h-24 object-contain mr-6" />
                                    <div className="text-center flex-1 pr-16 font-sans">
                                        <h4 className="font-bold text-lg pb-1 uppercase tracking-tight leading-none">Pemerintah Kabupaten Tuban</h4>
                                        <h4 className="font-bold text-xl pb-1 uppercase tracking-tighter leading-tight">Kecamatan Grabagan</h4>
                                        <p className="text-[11px] pb-1 font-normal italic leading-normal">Jl. Raya Grabagan, Email: kecamatan.grabagan@gmail.com, Kode Pos 62373</p>
                                        <div className="flex justify-center">
                                            <div className="pb-1 font-bold text-lg uppercase tracking-[0.2em]">Grabagan</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-start font-sans">
                                    <div className="w-[50%] space-y-1">
                                        <p className="flex items-center text-sm">
                                            <span className="w-20">Nomor</span>:
                                            <span className="font-bold ml-1 flex items-center">
                                                900/
                                                <input
                                                    type="text"
                                                    value={outgoingLetterNo}
                                                    onChange={(e) => setOutgoingLetterNo(e.target.value)}
                                                    className="w-6 text-center border-slate-400 focus:border-blue-500 outline-none mx-1 bg-transparent"
                                                />
                                                /414.420/{new Date().getFullYear()}
                                            </span>
                                        </p>
                                        <p className="flex items-start"><span className="w-20">Sifat</span>: <span className="ml-1 flex-1">{letterNature}</span></p>
                                        <p className="flex items-start"><span className="w-20">Lampiran</span>: <span className="ml-1 flex-1">-</span></p>
                                        <p className="flex items-start font-bold"><span className="w-20 tracking-tight">Perihal</span>: <span className="ml-1 flex-1 underline decoration-1 underline-offset-4">{letterSubject}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="mb-6 font-medium">Grabagan, {new Date(letterDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        <div className="text-left inline-block">
                                            <p>Kepada Yth,</p>
                                            <p className="font-bold">Kepala Cabang Pembantu <br /> Bank Jatim Cabang Tuban</p>
                                            <p>di -</p>
                                            <p className="font-bold underline uppercase tracking-widest pl-4">RENGEL</p>
                                        </div>
                                    </div>
                                </div>

                                <p className="indent-[1.5cm] text-justify leading-relaxed mt-10">
                                    Berdasarkan surat Kepala Desa <span className="font-bold">{selectedVillage || "[Nama Desa]"}</span> tanggal <span className="font-bold">{new Date(letterDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span> Nomor: <span className="font-bold">900/{incomingLetterNo || '...'}/{currentVillageCode}/{new Date().getFullYear()}</span> Perihal permohonan pengantar pencairan rekening kas desa, maka bersama ini kami sampaikan kepada Cabang Pembantu Bank Jatim Cabang Tuban di Rengel, untuk melakukan pencairan dana dari Rekening Kas Desa <span className="font-bold">{selectedVillage || "[Nama Desa]"}</span>, sesuai SPM sebagai berikut:
                                </p>

                                {/* Table SPM with 5 Columns: NO, NOMOR SPM, KEGIATAN, ANGGARAN, KETERANGAN */}
                                <table className="w-full border-collapse border-2 border-black mt-8 text-[11px]">
                                    <thead>
                                        <tr className="bg-slate-50 uppercase font-sans font-bold">
                                            <th className="border-2 border-black p-1 w-10 text-center">No</th>
                                            <th className="border-2 border-black p-1 text-center w-32">Nomor SPM</th>
                                            <th className="border-2 border-black p-1 text-center">Kegiatan</th>
                                            <th className="border-2 border-black p-1 text-center w-36">Anggaran</th>
                                            <th className="border-2 border-black p-1 text-center w-24">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Helper Column Indices (Visual Only) */}
                                        <tr className="bg-slate-50 text-center font-bold text-[10px]">
                                            <td className="border-2 border-black p-1">1</td>
                                            <td className="border-2 border-black p-1">2</td>
                                            <td className="border-2 border-black p-1">3</td>
                                            <td className="border-2 border-black p-1">4</td>
                                            <td className="border-2 border-black p-1">5</td>
                                        </tr>
                                        {parsedData.activities.map((activity, index) => (
                                            <tr key={index}>
                                                <td className="border-2 border-black p-1 text-center">{activity.no || index + 1}</td>
                                                <td className="border-2 border-black p-1 font-normal">{activity.nomor_spm || '-'}</td>
                                                <td className="border-2 border-black p-1 leading-normal font-normal">{activity.description || activity.kegiatan}</td>
                                                <td className="border-2 border-black p-1 text-right font-mono font-bold">{(activity.amount || activity.anggaran || 0).toLocaleString('id-ID')}</td>
                                                <td className="border-2 border-black p-1 text-center font-normal italic">{activity.keterangan || 'ADD'}</td>
                                            </tr>
                                        ))}
                                        <tr className="font-bold bg-slate-50">
                                            <td colSpan="3" className="border-2 border-black p-2 text-center uppercase tracking-[0.15em]"> Jumlah</td>
                                            <td className="border-2 border-black p-2 text-right font-mono text-[13px]">{parsedData.totalBudget.toLocaleString('id-ID')}</td>
                                            <td className="border-2 border-black p-2"></td>
                                        </tr>
                                    </tbody>
                                </table>

                                <p className="indent-[1.5cm] text-justify leading-relaxed">Demikian untuk menjadikan periksa.</p>

                                <div className="flex justify-end">
                                    <div className="text-center w-[250px] space-y-1 font-sans">
                                        <p className="font-bold uppercase tracking-tight">{official?.status === "Plt." ? "Plt. " : ""}Camat Grabagan</p>
                                        <div className="h-[2.5cm]"></div>
                                        <p className="font-bold underline text-[14px] uppercase tracking-tighter">{official?.name || "H. SUWANTO, S.STP, M.M"}</p>
                                        <p className="font-normal text-[10px] uppercase tracking-wide">{official?.rank || "Pembina Tingkat I"}</p>
                                        <p className="font-normal text-[10px] tracking-widest">NIP. {official?.nip || "19780101 200501 1 012"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="p-20 text-center space-y-10 animate-in zoom-in-95 duration-700 font-normal">
                        <div className="relative inline-block font-normal">
                            <div className="bg-emerald-100 text-emerald-600 p-10 rounded-[3rem] w-36 h-36 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/10 border-4 border-white relative z-10 font-normal">
                                <CheckCircle2 size={72} strokeWidth={3} />
                            </div>
                            <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-500 rounded-full blur-2xl opacity-40"></div>
                        </div>
                        <div className="space-y-4 font-normal">
                            <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tight font-normal">Pengarsipan Selesai!</h3>
                            <p className="text-slate-500 font-medium text-lg font-normal">Dokumen rekomendasi telah diterbitkan dengan nomor arsip kecamatan:</p>
                            <div className="inline-block bg-slate-900 text-blue-400 font-mono text-2xl font-black px-8 py-4 rounded-[1.5rem] border border-slate-700 shadow-2xl font-normal">
                                900/{outgoingLetterNo}/414.420/{new Date().getFullYear()}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-5 justify-center mt-12 font-normal">
                            <button
                                onClick={handleDownloadDocx}
                                className="bg-slate-100 text-slate-800 px-10 py-5 rounded-2xl flex items-center justify-center gap-3 font-extrabold shadow-lg hover:bg-slate-200 transition-all uppercase tracking-widest text-xs active:scale-95 border border-slate-200 font-normal">
                                <Download size={20} /> Download DOCX
                            </button>
                            <button
                                onClick={handlePrintOnly}
                                className="bg-blue-600 text-white px-10 py-5 rounded-2xl flex items-center justify-center gap-3 font-extrabold shadow-2xl shadow-blue-500/30 hover:bg-blue-700 hover:scale-105 transition-all uppercase tracking-widest text-xs active:scale-95 border border-blue-400 font-normal">
                                <Printer size={20} /> Cetak Dokumen
                            </button>
                        </div>
                        <div className="pt-10 font-normal">
                            <button onClick={() => window.location.reload()} className="text-slate-400 font-bold text-xs hover:text-blue-600 flex items-center gap-2 mx-auto uppercase tracking-[0.2em] transition-all group font-normal">
                                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300 font-normal" /> Buat Rekomendasi Baru
                            </button>
                        </div>
                    </div>
                )}

                {/* Action Controls */}
                {step < 5 && (
                    <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center font-normal">
                        <button
                            onClick={() => setStep(s => Math.max(1, s - 1))}
                            disabled={step === 1}
                            className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all font-normal ${step === 1 ? 'text-slate-300 cursor-not-allowed border-transparent' : 'text-slate-600 hover:bg-white border border-slate-200 shadow-sm active:scale-95'}`}
                        >
                            <ArrowLeft size={16} /> Kembali
                        </button>

                        {step === 2 ? (
                            <button
                                onClick={simulateParsing}
                                className="bg-blue-600 text-white px-10 py-3.5 rounded-2xl flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-105 transition-all font-black uppercase tracking-widest text-xs active:scale-95 font-normal"
                            >
                                Proses File <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    if (step === 4) {
                                        handleFinalize();
                                    } else {
                                        setStep(s => Math.min(5, s + 1));
                                    }
                                }}
                                disabled={step === 1 && !selectedVillage}
                                className={`bg-blue-600 text-white px-10 py-3.5 rounded-2xl flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-105 transition-all font-black uppercase tracking-widest text-xs active:scale-95 font-normal ${step === 3 && 'hidden'} ${step === 1 && !selectedVillage ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {step === 4 ? 'Finalisasi & Arsip' : 'Lanjutkan'} <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BuatSurat;
