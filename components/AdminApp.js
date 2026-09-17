"use client";

import { useEffect, useMemo, useState } from "react";

export default function AdminApp() {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [waitingRoomCookie, setWaitingRoomCookie] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [slotId, setSlotId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const rows = useMemo(() => (status?.slots ?? []).flatMap((slot) => (slot.schedules ?? []).map((schedule) => ({ ...schedule, slot }))), [status]);

  async function load() {
    const response = await fetch("/api/admin/status", { cache: "no-store" });
    setStatus(await response.json());
  }
  useEffect(() => { load(); }, []);

  async function login(event) {
    event.preventDefault(); setMessage("Memeriksa akun…");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error);
    setMessage(""); load();
  }

  async function sync(sourceId) {
    setMessage("Mengambil data terbaru…");
    const response = await fetch("/api/admin/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...(sourceId ? { sourceId } : {}), ...(waitingRoomCookie ? { waitingRoomCookie } : {}) }) });
    const data = await response.json();
    const failures = data.results?.filter((item) => !item.ok) ?? [];
    setMessage(!response.ok ? data.error : failures.length ? `Gagal: ${failures.map((item) => item.error).join("; ")}` : `Selesai. ${data.results.length} sumber diperbarui.`);
    load();
  }

  async function importPayload(sourceId, payload) {
    setMessage("Memeriksa dan menyimpan snapshot…");
    const response = await fetch("/api/admin/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceId, payload }) });
    const data = await response.json();
    setMessage(response.ok ? `Snapshot tersimpan. ${data.count} sesi member diperbarui.` : data.error);
    load();
  }

  async function importJson(sourceId, file) {
    if (!file) return;
    try { await importPayload(sourceId, JSON.parse(await file.text())); }
    catch { setMessage("File bukan JSON yang valid."); }
  }

  async function pasteJson(sourceId) {
    try { await importPayload(sourceId, JSON.parse(await navigator.clipboard.readText())); }
    catch { setMessage("Clipboard tidak berisi JSON valid atau izin clipboard ditolak."); }
  }

  function resetScheduleForm() {
    setParticipantName(""); setSlotId(""); setEditingId(null);
  }

  async function saveSchedule(event) {
    event.preventDefault();
    const response = await fetch("/api/admin/schedules", { method: editingId ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...(editingId ? { id: editingId } : {}), participantName, slotId }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error);
    setMessage(editingId ? "Jadwal diperbarui." : "Jadwal ditambahkan.");
    resetScheduleForm(); await load();
  }

  function editSchedule(row) {
    setEditingId(row.id); setParticipantName(row.participant_name); setSlotId(row.slot.id);
    document.querySelector(".admin-schedule-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function deleteSchedule(id) {
    if (!window.confirm("Hapus jadwal peserta ini?")) return;
    const response = await fetch("/api/admin/schedules", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await response.json();
    setMessage(response.ok ? "Jadwal dihapus." : data.error);
    if (response.ok) { if (editingId === id) resetScheduleForm(); await load(); }
  }

  if (!status) return <main className="admin-shell"><p>Memuat…</p></main>;
  if (!status.authenticated) return <main className="admin-shell"><a className="wordmark" href="/">Ayo Senyumlah</a><form className="admin-login" onSubmit={login}><h1>Masuk admin</h1><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button className="primary-button" type="submit">Masuk</button>{message && <p role="status">{message}</p>}</form></main>;

  return <main className="admin-shell">
    <header className="admin-header"><div><a className="wordmark" href="/">Ayo Senyumlah</a><h1>Kelola data</h1><p>Tambah, ubah, atau hapus jadwal peserta dan perbarui data sesi.</p></div></header>
    {message && <p className="notice" role="status">{message}</p>}

    <section className="admin-section" aria-labelledby="participant-title">
      <div className="admin-section-heading"><div><h2 id="participant-title">Jadwal peserta</h2><p>{status.event?.name ?? "Belum ada event aktif"} · {rows.length} entri</p></div></div>
      <form className="admin-schedule-form" onSubmit={saveSchedule}>
        <label><span>Nama peserta</span><input value={participantName} onChange={(event) => setParticipantName(event.target.value)} minLength="2" maxLength="80" required /></label>
        <label><span>Sesi</span><select value={slotId} onChange={(event) => setSlotId(event.target.value)} required><option value="">Pilih sesi</option>{status.slots?.map((slot) => <option key={slot.id} value={slot.id}>{slot.member_name} · {slot.session_label} · {slot.lane_label || "Jalur menyusul"} · {slot.ticket_type} · {slot.group_name}</option>)}</select></label>
        <div className="admin-form-actions"><button className="primary-button" type="submit">{editingId ? "Simpan perubahan" : "Tambah jadwal"}</button>{editingId && <button className="quiet-button" type="button" onClick={resetScheduleForm}>Batal</button>}</div>
      </form>
      <div className="admin-schedule-list">{rows.map((row) => <article className="admin-schedule-row" key={row.id}><div><strong>{row.participant_name}</strong><small>{row.slot.member_name} · {row.slot.session_label} · {row.slot.lane_label || "Jalur menyusul"} · {row.slot.ticket_type} · {row.slot.group_name}</small></div><div className="admin-schedule-actions"><button className="secondary-button" type="button" onClick={() => editSchedule(row)}>Edit</button><button className="danger-button" type="button" onClick={() => deleteSchedule(row.id)}>Hapus</button></div></article>)}{!rows.length && <p className="admin-empty">Belum ada jadwal peserta.</p>}</div>
    </section>

    <section className="admin-section" aria-labelledby="source-title">
      <div className="admin-section-heading"><div><h2 id="source-title">Sumber data</h2><p>Snapshot lama tetap tersimpan bila API gagal atau sudah hilang.</p></div><button className="secondary-button" onClick={() => sync()}>Sinkronkan semua</button></div>
      <label className="admin-cookie"><span>Cookie Waiting Room</span><input type="password" value={waitingRoomCookie} onChange={(event) => setWaitingRoomCookie(event.target.value)} autoComplete="off" placeholder="Tempel value atau __cfwaitingroom_…=value" /><small>Opsional. Dipakai untuk request ini saja dan tidak disimpan.</small></label>
      <div className="source-list">{status.sources?.map((source) => <article className="source-row" key={source.id}><div><strong>{source.group_name} · {source.ticket_type}</strong><small>{source.last_success_at ? `Terakhir ${new Date(source.last_success_at).toLocaleString("id-ID")}` : "Belum pernah disinkronkan"}</small>{source.sync_error && <small className="error-text">{source.sync_error}</small>}</div><div className="source-actions"><a className="quiet-button" href={`https://jkt48.com/api/v1/exclusives/${source.exclusive_code}/bonus?lang=id`} target="_blank" rel="noreferrer">Buka API</a><button className="secondary-button" onClick={() => pasteJson(source.id)}>Tempel JSON</button><label className="file-button"><input type="file" accept="application/json,.json" onChange={(event) => importJson(source.id, event.target.files?.[0])} />Impor file</label><button className="secondary-button" onClick={() => sync(source.id)}>Sinkronkan</button></div></article>)}</div>
    </section>
  </main>;
}
