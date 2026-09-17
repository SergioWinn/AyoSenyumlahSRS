"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildScheduleCsvTemplate, parseScheduleCsv } from "../lib/csv";
import { memberPhotoUrl } from "../lib/member-photos";
import { PARTICIPANT_NAME_MAX, PARTICIPANT_NAME_MIN } from "../lib/schedule-limits";
import { requestJson } from "../lib/client-api";

const ALL = "Semua";
const TICKET_TABS = ["2-Shot", "Meet & Greet"];
const naturalCollator = new Intl.Collator("id-ID", { numeric: true });

function includes(value, query) {
  return String(value ?? "").toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID"));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function MemberPhoto({ slot }) {
  const url = memberPhotoUrl(slot.member_name, slot.group_name);
  const initials = slot.member_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <div className="member-photo" aria-hidden="true">
    {url && <img src={url} alt="" width="180" height="180" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling.hidden = false; }} />}
    <span hidden={Boolean(url)}>{initials || "?"}</span>
  </div>;
}

function downloadTemplate(slots) {
  const content = buildScheduleCsvTemplate(slots);
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
  const [withFriendsOnly, setWithFriendsOnly] = useState(false);
  const [selected, setSelected] = useState([]);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerTicket, setPickerTicket] = useState(TICKET_TABS[0]);
  const [mode, setMode] = useState("manual");
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState("light");

  const load = useCallback(async () => {
    try {
      const payload = await requestJson("/api/timetable", { cache: "no-store" }, "Jadwal belum bisa dimuat. Coba lagi.");
      setData({ loading: false, configured: payload.configured !== false, event: payload.event, slots: payload.slots ?? [], error: payload.error });
    } catch (error) {
      setData((current) => ({ ...current, loading: false, error: error.message }));
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setTheme(document.documentElement.dataset.theme || "light"); }, []);

  const sessions = useMemo(() => unique(data.slots.filter((slot) => slot.ticket_type === ticket).map((slot) => slot.session_label)).sort(naturalCollator.compare), [data.slots, ticket]);
  const visible = useMemo(() => data.slots.filter((slot) =>
    slot.ticket_type === ticket
    && (session === ALL || slot.session_label === session)
    && (!withFriendsOnly || slot.schedules?.length)
    && (!query || [slot.member_name, slot.group_name, slot.lane_label, ...(slot.schedules ?? []).map((item) => item.participant_name)].some((value) => includes(value, query)))
  ).sort((a, b) => naturalCollator.compare(a.lane_label ?? "", b.lane_label ?? "") || naturalCollator.compare(a.member_name, b.member_name)), [data.slots, query, session, ticket, withFriendsOnly]);
  const grouped = useMemo(() => Object.entries(Object.groupBy(visible, (slot) => slot.session_label)).sort(([a], [b]) => naturalCollator.compare(a, b)), [visible]);
  const people = useMemo(() => unique(visible.flatMap((slot) => (slot.schedules ?? []).map((item) => item.participant_name))), [visible]);
  const pickerSlots = useMemo(() => data.slots.filter((slot) => !pickerQuery || includes(slot.member_name, pickerQuery)), [data.slots, pickerQuery]);
  const pickerGroups = useMemo(() => TICKET_TABS.map((type) => [type, pickerSlots.filter((slot) => slot.ticket_type === type)]), [pickerSlots]);
  const pickerVisible = pickerGroups.find(([type]) => type === pickerTicket)?.[1] ?? [];
  const activeFilter = [ticket, session !== ALL && session, withFriendsOnly && "ada teman", query && `“${query}”`].filter(Boolean).join(" · ");

  function openInput(slotId) {
    const slot = data.slots.find((item) => item.id === slotId);
    setSelected(slotId ? [slotId] : []); setPickerQuery(""); setFeedback("");
    setPickerTicket(slot?.ticket_type ?? ticket);
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
    } catch (error) { setFeedback(error instanceof Error ? error.message : "CSV belum bisa dibaca. Periksa file lalu coba lagi."); }
  }

  async function save(event) {
    event.preventDefault(); setSaving(true); setFeedback("Menyimpan…");
    try {
      const result = await requestJson("/api/schedules", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ participantName: name, slotIds: selected }) }, "Jadwal belum tersimpan. Coba lagi.");
      await load();
      setFeedback(`${result.count} jadwal tersimpan.`);
      setTimeout(() => dialogRef.current?.close(), 650);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function copyRibbon() {
    const summary = people.length ? `${activeFilter}: ${people.join(", ")}` : `${activeFilter}: belum ada yang mengisi.`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus("Ringkasan disalin.");
    } catch {
      setCopyStatus("Tidak dapat disalin. Periksa izin clipboard.");
    }
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* Tema tetap berubah untuk sesi ini. */ }
    setTheme(next);
  }

  return <>
    <header className="site-header">
      <a className="wordmark" href="#jadwal"><Image src="/srs-logo.webp" alt="Logo Sumber Rezeki" width={64} height={64} priority /><span className="brand-name">Ayo Senyumlah</span></a>
      <nav aria-label="Aksi utama"><button className="theme-toggle" type="button" aria-label={`Gunakan tema ${theme === "dark" ? "terang" : "gelap"}`} title={`Gunakan tema ${theme === "dark" ? "terang" : "gelap"}`} onClick={toggleTheme}><span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span></button><button className="primary-button" onClick={() => openInput()}>Isi jadwal</button></nav>
    </header>

    <main>
      <section className="workspace" id="jadwal" aria-labelledby="schedule-title">
        <div className="workspace-heading"><div><h1 id="schedule-title">{data.event?.name ?? "Jadwal event"}</h1><p>{data.event ? [data.event.event_date && new Date(`${data.event.event_date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), data.event.venue].filter(Boolean).join(" · ") : "2-Shot dan Meet & Greet"}</p></div></div>

        <div className="schedule-tabs" role="tablist" aria-label="Tipe tiket">
          {TICKET_TABS.map((value) => <button key={value} role="tab" aria-selected={ticket === value} aria-controls="session-cards" onClick={() => { setTicket(value); setSession(ALL); }}>{value}<span>{unique(data.slots.filter((slot) => slot.ticket_type === value).map((slot) => slot.session_label)).length} sesi</span></button>)}
        </div>

        <div className="filters schedule-filters" aria-label="Filter jadwal">
          <label><span>Sesi</span><select value={session} onChange={(event) => setSession(event.target.value)}><option>{ALL}</option>{sessions.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="search-field"><span>Cari member atau teman</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ketik nama…" /></label>
          <label className="presence-filter"><input type="checkbox" checked={withFriendsOnly} onChange={(event) => setWithFriendsOnly(event.target.checked)} /><span>Hanya yang ada teman</span></label>
        </div>

        <aside className="meeting-ribbon" aria-live="polite">
          <div><span className="ribbon-mark" aria-hidden="true" /><p><strong>{people.length ? `${people.length} teman terlihat` : "Belum ada teman terlihat"}</strong><small>untuk {activeFilter}</small></p></div>
          <div className="people-line">{people.length ? people.slice(0, 8).map((person) => <span key={person}>{person}</span>) : <span>Jadilah yang pertama mengisi.</span>}</div>
          <div className="ribbon-action"><button className="quiet-button" onClick={copyRibbon} disabled={!visible.length}>Salin ringkasan</button><small role="status">{copyStatus}</small></div>
        </aside>

        {data.loading ? <div className="state-panel" role="status">Memuat jadwal…</div>
          : !data.configured ? <div className="state-panel"><strong>Sambungkan Supabase untuk menampilkan jadwal.</strong><p>Salin <code>.env.example</code> menjadi <code>.env.local</code>, lalu isi kredensial proyek.</p></div>
          : data.error ? <div className="state-panel error-text"><strong>Jadwal gagal dimuat.</strong><p>{data.error}</p><button className="secondary-button" onClick={load}>Coba lagi</button></div>
          : !data.event ? <div className="state-panel"><strong>Belum ada event aktif.</strong><p>Aktifkan satu event dari Supabase, lalu sinkronkan sumbernya.</p></div>
          : !grouped.length ? <div className="state-panel"><strong>Tidak ada jadwal yang cocok.</strong><p>Ubah filter atau kata pencarian.</p></div>
          : <div className="session-list" id="session-cards" role="tabpanel" aria-label={ticket}>{grouped.map(([sessionName, slots]) => <section className="session-group" key={sessionName}><header className="session-label"><div><h3>{sessionName}</h3><span>{ticket}</span></div><span>{slots.length} member</span></header><div className="member-grid">{slots.map((slot) => <article className="member-card" key={slot.id}><span className="lane-label">{slot.lane_label || "Jalur menyusul"}</span><MemberPhoto slot={slot} /><div className="slot-member"><h4>{slot.member_name}</h4><span>{slot.group_name}</span></div><div className="slot-people"><small>{slot.schedules?.length ? `${slot.schedules.length} teman di sesi ini` : "Belum ada teman"}</small>{slot.schedules?.map((item) => <span key={item.id}>{item.participant_name}</span>)}</div><button className="add-slot" aria-label={`Ikut jadwal ${slot.member_name}, ${sessionName}`} onClick={() => openInput(slot.id)}>+ Ikut sesi</button></article>)}</div></section>)}</div>}
      </section>
    </main>

    <footer className="site-footer"><div className="footer-inner"><span>Developed by <a href="https://x.com/estrellawin19" target="_blank" rel="noopener noreferrer">@estrellawin19</a></span><a className="tako-link" href="https://tako.id/Sportagame19Win" target="_blank" rel="noopener noreferrer">Support project ↗</a></div></footer>

    <dialog className="input-dialog" ref={dialogRef} onClose={() => setFeedback("")}>
      <form method="dialog" className="dialog-top"><div><span>Isi jadwal</span><h2>Pilih sesi</h2></div><button className="dialog-close" aria-label="Tutup">×</button></form>
      <div className="mode-tabs" role="tablist" aria-label="Cara input"><button role="tab" aria-selected={mode === "manual"} onClick={() => setMode("manual")}>Pilih manual</button><button role="tab" aria-selected={mode === "csv"} onClick={() => setMode("csv")}>Impor CSV</button></div>
      <form className="input-form" onSubmit={save}>
        <label><span>Nama kamu</span><input value={name} onChange={(event) => setName(event.target.value)} minLength={PARTICIPANT_NAME_MIN} maxLength={PARTICIPANT_NAME_MAX} autoComplete="name" placeholder="Nama panggilan" required /><small>{name.length}/{PARTICIPANT_NAME_MAX} karakter</small></label>
        {mode === "csv" ? <div className="csv-box"><div className="csv-guide"><strong>Cara mengisi CSV</strong><ol><li>Unduh template yang sudah berisi contoh dari event ini.</li><li>Ganti atau hapus baris contoh, lalu isi satu jadwal per baris. Jangan ubah judul kolom.</li><li>Pastikan nama member, sesi, jalur, dan tipe tiket sama seperti yang tampil di jadwal.</li></ol></div><div className="csv-actions"><button type="button" className="secondary-button" onClick={() => downloadTemplate(data.slots)}>Unduh template dengan contoh</button><label className="file-button"><input type="file" accept=".csv,text/csv" onChange={importCsv} />Pilih CSV yang sudah diisi</label></div><small>Contoh di template diambil dari {Math.min(data.slots.length, 2)} jadwal pertama dan tidak otomatis dipilih sampai file diunggah.</small></div>
          : <div className="manual-picker"><label className="picker-search"><span>Cari member</span><input type="search" value={pickerQuery} onChange={(event) => setPickerQuery(event.target.value)} placeholder="Ketik nama member…" /></label><div className="picker-ticket-tabs" role="tablist" aria-label="Tipe tiket pilihan manual">{pickerGroups.map(([type, slots]) => <button type="button" role="tab" aria-selected={pickerTicket === type} key={type} onClick={() => setPickerTicket(type)}>{type}<span>{slots.length}</span></button>)}</div><fieldset className="slot-picker"><legend>Pilih jadwal <span>{selected.length} dipilih · {pickerVisible.length} hasil</span></legend>{pickerVisible.map((slot) => <label key={slot.id}><input type="checkbox" checked={selected.includes(slot.id)} onChange={() => toggleSlot(slot.id)} /><span><strong>{slot.member_name}</strong><small>{slot.session_label} · {slot.lane_label || "Jalur menyusul"} · {slot.group_name}</small></span></label>)}{!pickerVisible.length && <p className="slot-picker-empty">Tidak ada member yang cocok.</p>}</fieldset></div>}
        <p className="form-feedback" role="status">{feedback}</p>
        <button className="primary-button submit-button" disabled={saving || selected.length === 0 || name.trim().length < PARTICIPANT_NAME_MIN || name.trim().length > PARTICIPANT_NAME_MAX}>{saving ? "Menyimpan…" : `Simpan ${selected.length || ""} jadwal`}</button>
      </form>
    </dialog>
  </>;
}
