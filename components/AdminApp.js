"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PARTICIPANT_NAME_MAX, PARTICIPANT_NAME_MIN } from "../lib/schedule-limits";
import { requestJson } from "../lib/client-api";

export default function AdminApp() {
  const actionInFlight = useRef(false);
  const participantInput = useRef(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [waitingRoomCookie, setWaitingRoomCookie] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [slotId, setSlotId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const rows = useMemo(() => (status?.slots ?? []).flatMap((slot) => (slot.schedules ?? []).map((schedule) => ({ ...schedule, slot }))), [status]);

  function showError(error) {
    setMessage(error instanceof Error ? error.message : "Permintaan belum berhasil. Coba lagi.");
    if (error?.status === 401) setStatus({ authenticated: false });
  }

  async function runAction(action) {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setBusy(true);
    try { await action(); }
    catch (error) { showError(error); }
    finally { actionInFlight.current = false; setBusy(false); }
  }

  async function load() {
    try {
      setLoadError("");
      setStatus(await requestJson("/api/admin/status", { cache: "no-store" }, "Data admin belum bisa dimuat. Coba lagi."));
    } catch (error) {
      setLoadError(error.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function login(event) {
    event.preventDefault();
    const credentials = Object.fromEntries(new FormData(event.currentTarget));
    await runAction(async () => {
      setMessage("Memeriksa akun…");
      await requestJson("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(credentials) }, "Akun belum bisa diperiksa. Coba lagi.");
      setMessage(""); await load();
    });
  }

  async function sync(sourceId) {
    await runAction(async () => {
      setMessage("Mengambil data terbaru…");
      const data = await requestJson("/api/admin/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...(sourceId ? { sourceId } : {}), ...(waitingRoomCookie ? { waitingRoomCookie } : {}) }) }, "Sinkronisasi belum berhasil. Coba lagi.");
      const failures = data.results?.filter((item) => !item.ok) ?? [];
      setMessage(failures.length ? `Gagal: ${failures.map((item) => item.error).join("; ")}` : `Selesai. ${data.results.length} sumber diperbarui.`);
      await load();
    });
  }

  async function importPayload(sourceId, payload) {
    setMessage("Memeriksa dan menyimpan snapshot…");
    const data = await requestJson("/api/admin/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceId, payload }) }, "Snapshot belum bisa disimpan. Coba lagi.");
    setMessage(`Snapshot tersimpan. ${data.count} sesi member diperbarui.`);
    await load();
  }

  async function importJson(sourceId, file) {
    if (!file) return;
    await runAction(async () => {
      let payload;
      try { payload = JSON.parse(await file.text()); }
      catch { return setMessage("File bukan JSON yang valid. Pilih file hasil salinan API."); }
      await importPayload(sourceId, payload);
    });
  }

  async function pasteJson(sourceId) {
    await runAction(async () => {
      let text;
      try { text = await navigator.clipboard.readText(); }
      catch { return setMessage("Clipboard tidak dapat dibaca. Izinkan akses clipboard lalu coba lagi."); }
      let payload;
      try { payload = JSON.parse(text); }
      catch { return setMessage("Teks clipboard bukan JSON yang valid."); }
      await importPayload(sourceId, payload);
    });
  }

  function resetScheduleForm() {
    setParticipantName(""); setSlotId(""); setEditingId(null);
  }

  async function saveSchedule(event) {
    event.preventDefault();
    await runAction(async () => {
      setMessage("Menyimpan jadwal…");
      await requestJson("/api/admin/schedules", { method: editingId ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...(editingId ? { id: editingId } : {}), participantName, slotId }) }, "Jadwal belum bisa disimpan. Coba lagi.");
      setMessage(editingId ? "Jadwal diperbarui." : "Jadwal ditambahkan.");
      resetScheduleForm(); await load();
    });
  }

  function editSchedule(row) {
    setPendingDeleteId(null);
    setEditingId(row.id); setParticipantName(row.participant_name); setSlotId(row.slot.id);
    participantInput.current?.focus({ preventScroll: true });
    participantInput.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
  }

  async function deleteSchedule(id) {
    await runAction(async () => {
      setMessage("Menghapus jadwal…");
      await requestJson("/api/admin/schedules", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }, "Jadwal belum bisa dihapus. Coba lagi.");
      setMessage("Jadwal dihapus.");
      setPendingDeleteId(null);
      if (editingId === id) resetScheduleForm();
      await load();
    });
  }

  if (!status) return <main className="admin-shell">{loadError ? <div className="state-panel error-text"><strong>Data admin gagal dimuat.</strong><p>{loadError}</p><button disabled={busy} className="secondary-button" onClick={load}>Coba lagi</button></div> : <p>Memuat…</p>}</main>;
  if (!status.authenticated) return <main className="admin-shell"><a className="wordmark" href="/">Ayo Senyumlah</a><form aria-busy={busy} className="admin-login" onSubmit={login}><h1>Masuk admin</h1><label>Email<input disabled={busy} name="email" type="email" autoComplete="email" required /></label><label>Password<input disabled={busy} name="password" type="password" autoComplete="current-password" required /></label><button disabled={busy} className="primary-button" type="submit">Masuk</button>{message && <p role="status">{message}</p>}</form></main>;

  return <main className="admin-shell">
    <header className="admin-header"><div><a className="wordmark" href="/">Ayo Senyumlah</a><h1>Kelola data</h1><p>Tambah, ubah, atau hapus jadwal peserta dan perbarui data sesi.</p></div></header>
    {loadError && <p className="notice error-text" role="alert">{loadError}</p>}
    {message && <p className="notice" role="status">{message}</p>}

    <section className="admin-section" aria-labelledby="participant-title">
      <div className="admin-section-heading"><div><h2 id="participant-title">Jadwal peserta</h2><p>{status.event?.name ?? "Belum ada event aktif"} · {rows.length} entri</p></div></div>
      <form aria-busy={busy} className="admin-schedule-form" onSubmit={saveSchedule}>
        <label><span>Nama peserta</span><input disabled={busy} ref={participantInput} value={participantName} onChange={(event) => setParticipantName(event.target.value)} minLength={PARTICIPANT_NAME_MIN} maxLength={PARTICIPANT_NAME_MAX} required /></label>
        <label><span>Sesi</span><select disabled={busy} value={slotId} onChange={(event) => setSlotId(event.target.value)} required><option value="">Pilih sesi</option>{status.slots?.map((slot) => <option key={slot.id} value={slot.id}>{slot.member_name} · {slot.session_label} · {slot.lane_label || "Jalur menyusul"} · {slot.ticket_type} · {slot.group_name}</option>)}</select></label>
        <div className="admin-form-actions"><button disabled={busy} className="primary-button" type="submit">{editingId ? "Simpan perubahan" : "Tambah jadwal"}</button>{editingId && <button disabled={busy} className="quiet-button" type="button" onClick={resetScheduleForm}>Batal</button>}</div>
      </form>
      <div className="admin-schedule-list">{rows.map((row) => <article className="admin-schedule-row" key={row.id}><div><strong>{row.participant_name}</strong><small>{row.slot.member_name} · {row.slot.session_label} · {row.slot.lane_label || "Jalur menyusul"} · {row.slot.ticket_type} · {row.slot.group_name}</small></div><div className="admin-schedule-actions"><button disabled={busy} className="secondary-button" type="button" onClick={() => editSchedule(row)}>Edit</button>{pendingDeleteId === row.id ? <><button disabled={busy} className="danger-button is-confirming" type="button" onClick={() => deleteSchedule(row.id)}>Yakin hapus?</button><button disabled={busy} className="quiet-button" type="button" onClick={() => setPendingDeleteId(null)}>Batal</button></> : <button disabled={busy} className="danger-button" type="button" onClick={() => setPendingDeleteId(row.id)}>Hapus</button>}</div></article>)}{!rows.length && <p className="admin-empty">Belum ada jadwal peserta.</p>}</div>
    </section>

    <section className="admin-section" aria-labelledby="source-title">
      <div className="admin-section-heading"><div><h2 id="source-title">Sumber data</h2><p>Snapshot lama tetap tersimpan bila API gagal atau sudah hilang.</p></div><button disabled={busy} className="secondary-button" onClick={() => sync()}>Sinkronkan semua</button></div>
      <label className="admin-cookie"><span>Cookie Waiting Room</span><input disabled={busy} type="password" value={waitingRoomCookie} onChange={(event) => setWaitingRoomCookie(event.target.value)} autoComplete="off" placeholder="Tempel value atau __cfwaitingroom_…=value" /><small>Opsional. Dipakai untuk request ini saja dan tidak disimpan.</small></label>
      <div className="source-list">{status.sources?.map((source) => <article className="source-row" key={source.id}><div><strong>{source.group_name} · {source.ticket_type}</strong><small>{source.last_success_at ? `Terakhir ${new Date(source.last_success_at).toLocaleString("id-ID")}` : "Belum pernah disinkronkan"}</small>{source.sync_error && <small className="error-text">{source.sync_error}</small>}</div><div className="source-actions"><a className="quiet-button" href={`https://jkt48.com/api/v1/exclusives/${source.exclusive_code}/bonus?lang=id`} target="_blank" rel="noreferrer">Buka API</a><button disabled={busy} className="secondary-button" onClick={() => pasteJson(source.id)}>Tempel JSON</button><label className="file-button"><input disabled={busy} type="file" accept="application/json,.json" onChange={(event) => importJson(source.id, event.target.files?.[0])} />Impor file</label><button disabled={busy} className="secondary-button" onClick={() => sync(source.id)}>Sinkronkan</button></div></article>)}</div>
    </section>
  </main>;
}
