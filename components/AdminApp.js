"use client";

import { useEffect, useState } from "react";

export default function AdminApp() {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/status", { cache: "no-store" });
    setStatus(await response.json());
  }
  useEffect(() => { load(); }, []);

  async function login(event) {
    event.preventDefault(); setMessage("Memeriksa akun…");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error);
    setMessage(""); load();
  }

  async function sync(sourceId) {
    setMessage("Mengambil data terbaru…");
    const response = await fetch("/api/admin/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sourceId ? { sourceId } : {}) });
    const data = await response.json();
    setMessage(response.ok ? `Selesai. ${data.results?.filter((item) => item.ok).length ?? 0} sumber diperbarui.` : data.error);
    load();
  }

  if (!status) return <main className="admin-shell"><p>Memuat…</p></main>;
  if (!status.authenticated) return <main className="admin-shell"><a className="wordmark" href="/">Ayo Senyumlah</a><form className="admin-login" onSubmit={login}><h1>Masuk admin</h1><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button className="primary-button" type="submit">Masuk</button>{message && <p role="status">{message}</p>}</form></main>;

  return <main className="admin-shell"><header className="admin-header"><div><a className="wordmark" href="/">Ayo Senyumlah</a><h1>Sinkronisasi data</h1><p>Data lama tetap tersimpan bila API gagal atau sudah hilang.</p></div><button className="secondary-button" onClick={() => sync()}>Sinkronkan semua</button></header>{message && <p className="notice" role="status">{message}</p>}<div className="source-list">{status.sources?.map((source) => <article className="source-row" key={source.id}><div><strong>{source.group_name} · {source.ticket_type}</strong><small>{source.last_success_at ? `Terakhir ${new Date(source.last_success_at).toLocaleString("id-ID")}` : "Belum pernah disinkronkan"}</small>{source.sync_error && <small className="error-text">{source.sync_error}</small>}</div><button className="secondary-button" onClick={() => sync(source.id)}>Sinkronkan</button></article>)}</div></main>;
}
