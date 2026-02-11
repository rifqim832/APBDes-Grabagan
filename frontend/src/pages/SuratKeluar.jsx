import React, { useState, useEffect } from 'react';
import { MailCheck, Plus, Search, Calendar, Printer, ArrowDownUp } from 'lucide-react';
import ActionButtons from '../components/ActionButtons';
import { getOutgoingLetters, getOfficial, deleteOutgoingLetter } from '../services/api';
import logo from '../assets/logo.png';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

const SuratKeluar = ({ villages, setActiveTab, userRole, token }) => {
    const [letters, setLetters] = useState([]);
    const [search, setSearch] = useState("");
    const [filterVillage, setFilterVillage] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [sortOrder, setSortOrder] = useState("terbaru");
    const [selectedLetter, setSelectedLetter] = useState(null);
    const [official, setOfficial] = useState(null);

    const handlePreview = (letter) => {
        setSelectedLetter(letter);
    };

    const handlePrint = (letter) => {
        setSelectedLetter(letter);
    };

    const handleDownload = async (letter) => {
        try {
            const response = await fetch(`/assets/template_surat_keluar.docx?t=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`Template file not found (Status: ${response.status})`);

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.toLowerCase().includes("text/html")) {
                throw new Error("Template path returned HTML instead of DOCX. Please ensure 'public/assets/template_surat_keluar.docx' exists.");
            }

            const content = await response.arrayBuffer();
            if (content.byteLength === 0) throw new Error("Template file is empty.");

            const view = new Uint8Array(content);
            if (view[0] !== 0x50 || view[1] !== 0x4B) throw new Error("Invalid DOCX file.");

            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

            const spmEntries = letter.spmEntries || [];
            const formattedActivities = spmEntries.map(entry => ({
                no: entry.indexNo,
                nomor_spm: entry.spmNo,
                kegiatan: entry.activity,
                anggaran: Number(entry.amount || 0).toLocaleString('id-ID'),
                keterangan: entry.description || 'ADD'
            }));

            doc.render({
                nomor_surat: letter.letterNo,
                nomor_masuk: letter.incomingLetter?.referenceNo || "",
                sifat: "Penting",
                perihal: letter.subject,
                desa: letter.village?.name || "[Nama Desa]",
                kode_desa: letter.village?.villageCode || "414.420",
                tahun: new Date(letter.letterDate).getFullYear(),
                tanggal: new Date(letter.letterDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }),
                spm_list: formattedActivities,
                total_budget: Number(letter.totalBudget || 0).toLocaleString('id-ID'),
                total_anggaran: Number(letter.totalBudget || 0).toLocaleString('id-ID'),
                status_camat: official?.status === "Plt." ? "Plt. " : "",
                nama_camat: official?.name || "H. SUWANTO, S.STP, M.M",
                pangkat_camat: official?.rank || "Pembina Tingkat I",
                nip_camat: official?.nip || "19780101 200501 1 012"
            });

            const out = doc.getZip().generate({
                type: "blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            saveAs(out, `Rekomendasi_Pencairan_${letter.village?.name || "Desa"}_${new Date().toISOString().split('T')[0]}.docx`);
        } catch (error) {
            console.error(error);
            alert("Gagal mengunduh DOCX: " + error.message);
        }
    };

    const handleDelete = async (letter) => {
        const confirmMsg = `Yakin ingin menghapus surat keluar ${letter.letterNo} - Desa ${letter.village?.name}?\n\nData yang dihapus tidak bisa dikembalikan!`;
        if (!window.confirm(confirmMsg)) return;

        try {
            await fetch(`http://localhost:3000/api/surat/keluar/${letter.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Refresh data
            const updatedLetters = await getOutgoingLetters();
            setLetters(updatedLetters);
        } catch (error) {
            alert("Gagal menghapus surat: " + error.message);
        }
    };
    useEffect(() => {
        getOutgoingLetters()
            .then(setLetters)
            .catch(console.error);
        getOfficial()
            .then(setOfficial)
            .catch(console.error);
    }, []);

    const filteredLetters = letters
        .filter(l => {
            const matchSearch = search === "" ||
                l.letterNo.toLowerCase().includes(search.toLowerCase()) ||
                (l.village?.name || "").toLowerCase().includes(search.toLowerCase());
            const matchVillage = filterVillage === "" || l.village?.name === filterVillage;
            const matchDate = filterDate === "" || l.letterDate?.startsWith(filterDate);
            return matchSearch && matchVillage && matchDate;
        })
        .sort((a, b) => {
            const dateA = new Date(a.letterDate || 0);
            const dateB = new Date(b.letterDate || 0);
            return sortOrder === "terbaru" ? dateB - dateA : dateA - dateB;
        });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-600/20">
                        <MailCheck size={22} />
                    </div>
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-800 font-normal">Arsip Surat Rekomendasi</h2>
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
                            placeholder="Cari nomor surat atau nama desa..."
                            className="w-full pl-11 pr-4 py-3 border-slate-200 border rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none font-normal text-sm transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="border-slate-200 border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 min-w-[200px] font-normal text-slate-600 text-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_1rem_center] bg-no-repeat transition-all"
                        value={filterVillage}
                        onChange={(e) => setFilterVillage(e.target.value)}
                    >
                        <option value="">Semua Desa</option>
                        {villages.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input
                            type="date"
                            className="pl-11 pr-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 font-normal text-slate-600 text-sm transition-all shadow-sm bg-white"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setSortOrder(prev => prev === "terbaru" ? "terlama" : "terbaru")}
                        className="p-3 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95 group"
                        title={sortOrder === "terbaru" ? "Urutan: Terbaru" : "Urutan: Terlama"}
                    >
                        <ArrowDownUp size={18} className={`transition-colors ${sortOrder === "terbaru" ? "text-blue-600" : "text-slate-400"}`} />
                    </button>
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
                            {filteredLetters.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-slate-400 font-normal">Belum ada data surat keluar.</td>
                                </tr>
                            ) : (
                                filteredLetters.map((letter, i) => (
                                    <tr key={letter.id} className="hover:bg-blue-50/20 transition-all group">
                                        <td className="px-6 py-4 text-xs text-center font-semibold text-slate-400">{i + 1}</td>
                                        <td className="px-6 py-4 text-sm font-mono font-medium text-blue-700 underline decoration-blue-100 underline-offset-4 decoration-2 tracking-tighter transition-all group-hover:decoration-blue-400">
                                            900/{letter.letterNo}/414.420/{new Date(letter.letterDate).getFullYear()}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-normal text-slate-700 uppercase">{letter.village?.name || "Unknown"}</td>
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-tight font-normal">
                                            {new Date(letter.letterDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-right text-emerald-600 font-bold">
                                            Rp {Number(letter.totalBudget || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <ActionButtons
                                                onPreview={() => handlePreview(letter)}
                                                onPrint={() => handlePrint(letter)}
                                                onDownload={() => handleDownload(letter)}
                                                onDelete={userRole === 'OPERATOR' ? () => handleDelete(letter) : undefined}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Preview Modal */}
                {selectedLetter && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-lg text-slate-800">Preview Surat Rekomendasi</h3>
                                <button
                                    onClick={() => setSelectedLetter(null)}
                                    className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 bg-slate-200 flex justify-center">
                                {/* A4 Simulator */}
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
                                                    900/{selectedLetter.letterNo}/414.420/{new Date(selectedLetter.letterDate).getFullYear()}
                                                </span>
                                            </p>
                                            <p className="flex items-start"><span className="w-20">Sifat</span>: <span className="ml-1 flex-1">Penting</span></p>
                                            <p className="flex items-start"><span className="w-20">Lampiran</span>: <span className="ml-1 flex-1">-</span></p>
                                            <p className="flex items-start font-bold"><span className="w-20 tracking-tight">Perihal</span>: <span className="ml-1 flex-1 underline decoration-1 underline-offset-4">{selectedLetter.subject}</span></p>
                                        </div>
                                        <div className="text-right">
                                            <p className="mb-6 font-medium">Grabagan, {new Date(selectedLetter.letterDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            <div className="text-left inline-block">
                                                <p>Kepada Yth,</p>
                                                <p className="font-bold">Kepala Cabang Pembantu <br /> Bank Jatim Cabang Tuban</p>
                                                <p>di -</p>
                                                <p className="font-bold underline uppercase tracking-widest pl-4">RENGEL</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="indent-[1.5cm] text-justify leading-relaxed mt-10">
                                        <p>
                                            Berdasarkan surat Kepala Desa <span className="font-bold">{selectedLetter.village?.name || "[Nama Desa]"}</span> tanggal <span className="font-bold">{new Date(selectedLetter.letterDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span> Nomor: <span className="font-bold">900/{selectedLetter.incomingLetter?.referenceNo || '...'}/{selectedLetter.village?.villageCode || '414.420'}/{new Date(selectedLetter.letterDate).getFullYear()}</span> Perihal permohonan pengantar pencairan rekening kas desa, maka bersama ini kami sampaikan kepada Cabang Pembantu Bank Jatim Cabang Tuban di Rengel, untuk melakukan pencairan dana dari Rekening Kas Desa <span className="font-bold">{selectedLetter.village?.name || "[Nama Desa]"}</span>, sesuai SPM sebagai berikut:
                                        </p>
                                    </div>

                                    {/* Table SPM - Now uses spmEntries from database (no more JSON parsing!) */}
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
                                            {selectedLetter.spmEntries && selectedLetter.spmEntries.length > 0 ? (
                                                <>
                                                    {selectedLetter.spmEntries.map((entry, index) => (
                                                        <tr key={entry.id || index}>
                                                            <td className="border-2 border-black p-1 text-center">{entry.indexNo}</td>
                                                            <td className="border-2 border-black p-1 font-normal">{entry.spmNo || '-'}</td>
                                                            <td className="border-2 border-black p-1 leading-normal font-normal">{entry.activity}</td>
                                                            <td className="border-2 border-black p-1 text-right font-mono font-bold">{Number(entry.amount || 0).toLocaleString('id-ID')}</td>
                                                            <td className="border-2 border-black p-1 text-center font-normal italic">{entry.description || 'ADD'}</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="font-bold bg-slate-50">
                                                        <td colSpan="3" className="border-2 border-black p-2 text-center uppercase tracking-[0.15em]"> Jumlah</td>
                                                        <td className="border-2 border-black p-2 text-right font-mono text-[13px]">{Number(selectedLetter.totalBudget).toLocaleString('id-ID')}</td>
                                                        <td className="border-2 border-black p-2"></td>
                                                    </tr>
                                                </>
                                            ) : (
                                                <tr className="font-bold bg-slate-50">
                                                    <td colSpan="3" className="border-2 border-black p-2 text-center uppercase tracking-[0.15em]"> Jumlah (Detail Tidak Tersedia)</td>
                                                    <td className="border-2 border-black p-2 text-right font-mono text-[13px]">{Number(selectedLetter.totalBudget || 0).toLocaleString('id-ID')}</td>
                                                    <td className="border-2 border-black p-2"></td>
                                                </tr>
                                            )}
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

                            <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
                                <button
                                    onClick={() => setSelectedLetter(null)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                                >
                                    Tutup
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <Printer size={16} /> Cetak
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuratKeluar;
