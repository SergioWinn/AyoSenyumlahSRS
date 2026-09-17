const STATUS_MESSAGES = {
  400: "Data yang dikirim belum valid. Periksa kembali lalu coba lagi.",
  401: "Sesi kamu sudah berakhir. Silakan masuk lagi.",
  403: "Kamu tidak memiliki akses untuk melakukan tindakan ini.",
  404: "Data yang diminta tidak ditemukan.",
  409: "Data sudah berubah. Muat ulang lalu coba lagi.",
  429: "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.",
};

export async function requestJson(url, options, fallback = "Permintaan gagal. Coba lagi.") {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error("Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.");
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error || STATUS_MESSAGES[response.status] || fallback);
    error.status = response.status;
    throw error;
  }
  if (!payload || typeof payload !== "object") throw new Error(fallback);
  return payload;
}
