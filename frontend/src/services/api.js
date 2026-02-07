const API_URL = "http://localhost:3000/api";

export const getDesa = async () => {
    const response = await fetch(`${API_URL}/desa`);
    if (!response.ok) throw new Error("Gagal mengambil data desa");
    return response.json();
};

export const getSurat = async () => {
    const response = await fetch(`${API_URL}/surat`);
    if (!response.ok) throw new Error("Gagal mengambil data surat");
    return response.json();
};

export const createSurat = async (data) => {
    const response = await fetch(`${API_URL}/surat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Gagal membuat surat");
    return response.json();
};

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
