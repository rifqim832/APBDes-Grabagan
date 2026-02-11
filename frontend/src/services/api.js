const API_URL = "http://localhost:3000/api";

// ============================================================
// VILLAGES (Desa)
// ============================================================

export const getDesa = async () => {
    const response = await fetch(`${API_URL}/villages`);
    if (!response.ok) throw new Error("Gagal mengambil data desa");
    return response.json();
};

export const updateVillage = async (id, data) => {
    const response = await fetch(`${API_URL}/villages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Gagal memperbarui data desa");
    return response.json();
};

// ============================================================
// OFFICIALS (Pejabat Kecamatan)
// ============================================================

export const getOfficial = async () => {
    const response = await fetch(`${API_URL}/officials`);
    if (!response.ok) throw new Error("Gagal mengambil data pejabat");
    return response.json();
};

export const updateOfficial = async (id, data) => {
    const response = await fetch(`${API_URL}/officials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Gagal memperbarui data pejabat");
    return response.json();
};

// ============================================================
// SURAT KELUAR (Outgoing Letters)
// ============================================================

export const getOutgoingLetters = async () => {
    const response = await fetch(`${API_URL}/surat/keluar`);
    if (!response.ok) throw new Error("Gagal mengambil data surat keluar");
    return response.json();
};

export const getOutgoingLetterById = async (id) => {
    const response = await fetch(`${API_URL}/surat/keluar/${id}`);
    if (!response.ok) throw new Error("Gagal mengambil detail surat keluar");
    return response.json();
};

export const deleteOutgoingLetter = async (id) => {
    const response = await fetch(`${API_URL}/surat/keluar/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error("Gagal menghapus surat");
    return response.json();
};

// ============================================================
// SURAT MASUK (Incoming Letters)
// ============================================================

export const getIncomingLetters = async () => {
    const response = await fetch(`${API_URL}/surat/masuk`);
    if (!response.ok) throw new Error("Gagal mengambil data surat masuk");
    return response.json();
};

// ============================================================
// CREATE LETTERS (Transactional: Incoming + Outgoing + SPM)
// ============================================================

export const createLetters = async (data) => {
    const response = await fetch(`${API_URL}/surat/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Gagal membuat surat");
    return response.json();
};

// ============================================================
// UTILITIES
// ============================================================

export const getLastSuratNumber = async () => {
    const response = await fetch(`${API_URL}/surat/last-number`);
    if (!response.ok) {
        console.warn("Gagal mengambil nomor surat terakhir, default ke 001");
        return { nextNumber: "001" };
    }
    return response.json();
};

export const getStats = async () => {
    const response = await fetch(`${API_URL}/surat/stats`);
    if (!response.ok) throw new Error("Gagal mengambil statistik");
    return response.json();
};

// ============================================================
// PARSING (Excel Upload)
// ============================================================

export const uploadExcel = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/parsing/parse-excel`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        let errorMessage;
        try {
            const errorJson = await response.json();
            errorMessage = errorJson.details || errorJson.error || "Unknown server error";
            if (errorJson.stack) console.error("Server Stack:", errorJson.stack);
        } catch (e) {
            errorMessage = await response.text();
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

// ============================================================
// PAGU DANA DESA (Monitoring Anggaran)
// ============================================================

export const getPaguByYear = async (year) => {
    const response = await fetch(`${API_URL}/pagu/${year}`);
    if (!response.ok) throw new Error("Gagal mengambil data pagu");
    return response.json();
};

export const upsertPagu = async (data) => {
    const response = await fetch(`${API_URL}/pagu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Gagal menyimpan pagu");
    return response.json();
};

export const getMonitoringAnggaran = async (year) => {
    const response = await fetch(`${API_URL}/pagu/monitoring/${year}`);
    if (!response.ok) throw new Error("Gagal mengambil data monitoring");
    return response.json();
};
