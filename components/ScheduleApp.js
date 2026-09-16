"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CSV_COLUMNS, parseScheduleCsv } from "../lib/csv";

const ALL = "Semua";
const TICKET_TABS = ["2-Shot", "Meet & Greet"];
const sessionCollator = new Intl.Collator("id-ID", { numeric: true });

function includes(value, query) {
  return String(value ?? "").toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID"));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function downloadTemplate() {
  const content = `${CSV_COLUMNS.join(",")}\n"Nama member","Sesi 1","Jalur 1","Meet & Greet"\n`;
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  anchor.download = "template-jadwal.csv";
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

export default function ScheduleApp() {
  const dialogRef = useRef(null);
  const [data, setData] = useState({ loading: true, configured: true, event: null, slots: [] });
  const [ticket, setTicket] = useState(TICKET_TABS[0]);
  const [session, setSession] = useState(ALL);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [mode, setMode] = useState("manual");
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/timetable", { cache: "no-store" });
      const payload = await response.json();
      setData({ loading: false, configured: payload.configured !== false, event: payload.event, slots: payload.slots ?? [], error: payload.error });
    } catch {
      setData((current) => ({ ...current, loading: false, error: "Jadwal belum bisa dimuat." }));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const sessions = useMemo(() => unique(data.slots.filter((slot) => slot.ticket_type === ticket).map((slot) => slot.session_label)).sort(sessionCollator.compare), [data.slots, ticket]);
  const visible = useMemo(() => data.slots.filter((slot) =>
    slot.ticket_type === ticket
    && (session === ALL || slot.session_label === session)
    && (!query || [slot.member_name, slot.group_name, slot.lane_label, ...(slot.schedules ?? []).map((item) => item.participant_name)].some((value) => includes(value, query)))
  ), [data.slots, query, session, ticket]);
  const grouped = useMemo(() => Object.entries(Object.groupBy(visible, (slot) => slot.session_label)).sort(([a], [b]) => sessionCollator.compare(a, b)), [visible]);
  const people = useMemo(() => unique(visible.flatMap((slot) => (slot.schedules ?? []).map((item) => item.participant_name))), [visible]);
  const activeFilter = [ticket, session !== ALL && session, query && `“${query}”`].filter(Boolean).join(" · ");

  function openInput(slotId) {
    setSelected(slotId ? [slotId] : []); setFeedback("");
    dialogRef.current?.showModal();
  }

  function toggleSlot(slotId) {
    setSelected((current) => current.includes(slotId) ? current.filter((id) => id !== slotId) : [...current, slotId]);
  }

  async function importCsv(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = parseScheduleCsv(await file.text(), data.slots);
      setSelected(result.slotIds);
      setFeedback(result.unmatched.length ? `${result.slotIds.length} jadwal cocok. Tidak ditemukan: ${result.unmatched.join(", ")}.` : `${result.slotIds.length} jadwal siap disimpan.`);
    } catch (error) { setFeedback(error.message); }
  }

  async function save(event) {
    event.preventDefault(); setSaving(true); setFeedback("Menyimpan…");
    const response = await fetch("/api/schedules", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ participantName: name, slotIds: selected }) });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return setFeedback(result.error);
    await load();
    setFeedback(`${result.count} jadwal tersimpan.`);
    setTimeout(() => dialogRef.current?.close(), 650);
  }

  async function copyRibbon() {
    const summary = people.length ? `${activeFilter}: ${people.join(", ")}` : `${activeFilter}: belum ada yang mengisi.`;
    await navigator.clipboard.writeText(summary);
    setFeedback("Ringkasan disalin.");
  }

  return <>
    <header className="site-header">
      <a className="wordmark" href="#jadwal">Ayo Senyumlah<span aria-hidden="true">.</span></a>
      <nav aria-label="Navigasi utama"><a href="#jadwal">Jadwal</a><button className="primary-button" onClick={() => openInput()}>Isi jadwal</button></nav>
    </header>

    <main>
      <section className="intro" aria-labelledby="page-title">
        <div><p className="intro-kicker">Jadwal barengan komunitas</p><h1 id="page-title">Datang sendiri,<br />pulang barengan.</h1></div>
        <p className="intro-copy">Cari teman di sesi 2-Shot dan Meet &amp; Greet yang sama. Satu timetable untuk JKT48 dan AKB48.</p>
      </section>

      <section className="workspace" id="jadwal" aria-labelledby="schedule-title">
        <div className="workspace-heading"><div><h2 id="schedule-title">{data.event?.name ?? "Jadwal event"}</h2><p>{data.event ? [data.event.event_date && new Date(`${data.event.event_date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), data.event.venue].filter(Boolean).join(" · ") : "2-Shot dan Meet & Greet"}</p></div><button className="primary-button desktop-input" onClick={() => openInput()}>+ Isi jadwal</button></div>

        <div className="schedule-tabs" role="tablist" aria-label="Tipe tiket">
          {TICKET_TABS.map((value) => <button key={value} role="tab" aria-selected={ticket === value} aria-controls="session-cards" onClick={() => { setTicket(value); setSession(ALL); }}>{value}<span>{unique(data.slots.filter((slot) => slot.ticket_type === value).map((slot) => slot.session_label)).length} sesi</span></button>)}
        </div>

        <div className="filters schedule-filters" aria-label="Filter jadwal">
          <label><span>Sesi</span><select value={session} onChange={(event) => setSession(event.target.value)}><option>{ALL}</option>{sessions.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="search-field"><span>Cari member atau teman</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ketik nama…" /></label>
        </div>

        <aside className="meeting-ribbon" aria-live="polite">
          <div><span className="ribbon-mark" aria-hidden="true" /><p><strong>{people.length ? `${people.length} teman terlihat` : "Belum ada teman terlihat"}</strong><small>untuk {activeFilter}</small></p></div>
          <div className="people-line">{people.length ? people.slice(0, 8).map((person) => <span key={person}>{person}</span>) : <span>Jadilah yang pertama mengisi.</span>}</div>
          <button className="quiet-button" onClick={copyRibbon} disabled={!visible.length}>Salin ringkasan</button>
        </aside>

        {data.loading ? <div className="state-panel" role="status">Memuat jadwal…</div>
          : !data.configured ? <div className="state-panel"><strong>Sambungkan Supabase untuk menampilkan jadwal.</strong><p>Salin <code>.env.example</code> menjadi <code>.env.local</code>, lalu isi kredensial proyek.</p></div>
          : data.error ? <div className="state-panel error-text"><strong>Jadwal gagal dimuat.</strong><p>{data.error}</p><button className="secondary-button" onClick={load}>Coba lagi</button></div>
          : !data.event ? <div className="state-panel"><strong>Belum ada event aktif.</strong><p>Aktifkan satu event dari Supabase, lalu sinkronkan sumbernya.</p></div>
          : !grouped.length ? <div className="state-panel"><strong>Tidak ada jadwal yang cocok.</strong><p>Ubah filter atau kata pencarian.</p></div>
          : <div className="session-list" id="session-cards" role="tabpanel" aria-label={ticket}>{grouped.map(([sessionName, slots]) => <section className="session-card" key={sessionName}><header className="session-label"><div><h3>{sessionName}</h3><span>{ticket}</span></div><span>{slots.length} member</span></header><div className="slot-list">{slots.map((slot) => <article className="slot-row" key={slot.id}><div className="slot-member"><h4>{slot.member_name}</h4><span>{slot.group_name} · {slot.lane_label || "Jalur menyusul"}</span></div><div className="slot-people">{slot.schedules?.length ? slot.schedules.map((item) => <span key={item.id}>{item.participant_name}</span>) : <small>Belum ada teman</small>}</div><button className="add-slot" aria-label={`Ikut jadwal ${slot.member_name}, ${sessionName}`} onClick={() => openInput(slot.id)}>+</button></article>)}</div></section>)}</div>}
      </section>
    </main>

    <footer className="site-footer"><p>Ketemu di venue. Jangan sendirian.</p><a href="/admin">Admin</a></footer>

    <dialog className="input-dialog" ref={dialogRef} onClose={() => setFeedback("")}>
      <form method="dialog" className="dialog-top"><div><span>Jadwal komunitas</span><h2>Ikut sesi mana?</h2></div><button className="dialog-close" aria-label="Tutup">×</button></form>
      <div className="mode-tabs" role="tablist" aria-label="Cara input"><button role="tab" aria-selected={mode === "manual"} onClick={() => setMode("manual")}>Pilih manual</button><button role="tab" aria-selected={mode === "csv"} onClick={() => setMode("csv")}>Impor CSV</button></div>
      <form className="input-form" onSubmit={save}>
        <label><span>Nama kamu</span><input value={name} onChange={(event) => setName(event.target.value)} minLength="2" maxLength="80" autoComplete="name" placeholder="Nama yang dikenal komunitas" required /></label>
        {mode === "csv" ? <div className="csv-box"><label className="file-button"><input type="file" accept=".csv,text/csv" onChange={importCsv} />Pilih file CSV</label><button type="button" className="quiet-button" onClick={downloadTemplate}>Unduh template</button><small>Kolom: {CSV_COLUMNS.join(", ")}. Jalur diverifikasi dari data terbaru.</small></div>
          : <fieldset className="slot-picker"><legend>Pilih jadwal <span>{selected.length} dipilih</span></legend>{data.slots.map((slot) => <label key={slot.id}><input type="checkbox" checked={selected.includes(slot.id)} onChange={() => toggleSlot(slot.id)} /><span><strong>{slot.member_name}</strong><small>{slot.session_label} · {slot.lane_label || "Jalur menyusul"} · {slot.ticket_type} · {slot.group_name}</small></span></label>)}</fieldset>}
        <p className="form-feedback" role="status">{feedback}</p>
        <button className="primary-button submit-button" disabled={saving || selected.length === 0 || name.trim().length < 2}>{saving ? "Menyimpan…" : `Simpan ${selected.length || ""} jadwal`}</button>
      </form>
    </dialog>
  </>;
}
