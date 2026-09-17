"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseScheduleCsv } from "../lib/csv";
import { memberNameMatches, memberPhotoUrl } from "../lib/member-photos";
import { PARTICIPANT_NAME_MAX, PARTICIPANT_NAME_MIN } from "../lib/schedule-limits";
import { requestJson } from "../lib/client-api";

const ALL = "Semua";
const ALL_MEMBERS = "Semua member";
const ALL_FRIENDS = "Semua teman";
const TICKET_TABS = ["2-Shot", "Meet & Greet"];
const REFRESH_INTERVAL_MS = 20_000;
const naturalCollator = new Intl.Collator("id-ID", { numeric: true });

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

export default function ScheduleApp() {
  const dialogRef = useRef(null);
  const refreshInFlight = useRef(false);
  const [data, setData] = useState({ loading: true, configured: true, event: null, slots: [] });
  const [ticket, setTicket] = useState(TICKET_TABS[0]);
  const [session, setSession] = useState(ALL);
  const [memberFilter, setMemberFilter] = useState(ALL_MEMBERS);
  const [friendFilter, setFriendFilter] = useState(ALL_FRIENDS);
  const [withFriendsOnly, setWithFriendsOnly] = useState(false);
  const [selected, setSelected] = useState([]);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerTicket, setPickerTicket] = useState(TICKET_TABS[0]);
  const [mode, setMode] = useState("manual");
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState("light");
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    try {
      const payload = await requestJson("/api/timetable", { cache: "no-store" }, "Jadwal belum bisa dimuat. Coba lagi.");
      setData({ loading: false, configured: payload.configured !== false, event: payload.event, slots: payload.slots ?? [], error: payload.error });
      setLastUpdated(new Date());
    } catch (error) {
      setData((current) => ({ ...current, loading: false, error: error.message }));
    } finally { refreshInFlight.current = false; }
  }, []);
  useEffect(() => {
    load();
    const refresh = () => { if (document.visibilityState === "visible") load(); };
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [load]);
  useEffect(() => { setTheme(document.documentElement.dataset.theme || "light"); }, []);

  const sessions = useMemo(() => unique(data.slots.filter((slot) => slot.ticket_type === ticket).map((slot) => slot.session_label)).sort(naturalCollator.compare), [data.slots, ticket]);
  const members = useMemo(() => unique(data.slots.filter((slot) => slot.ticket_type === ticket).map((slot) => slot.member_name)).sort(naturalCollator.compare), [data.slots, ticket]);
  const friends = useMemo(() => unique(data.slots.filter((slot) => slot.ticket_type === ticket).flatMap((slot) => (slot.schedules ?? []).map((item) => item.participant_name))).sort(naturalCollator.compare), [data.slots, ticket]);
  const visible = useMemo(() => data.slots.filter((slot) =>
    slot.ticket_type === ticket
    && (session === ALL || slot.session_label === session)
    && (memberFilter === ALL_MEMBERS || slot.member_name === memberFilter)
    && (friendFilter === ALL_FRIENDS || slot.schedules?.some((item) => item.participant_name === friendFilter))
    && (!withFriendsOnly || slot.schedules?.length)
  ).sort((a, b) => naturalCollator.compare(a.lane_label ?? "", b.lane_label ?? "") || naturalCollator.compare(a.member_name, b.member_name)), [data.slots, friendFilter, memberFilter, session, ticket, withFriendsOnly]);
  const grouped = useMemo(() => Object.entries(Object.groupBy(visible, (slot) => slot.session_label)).sort(([a], [b]) => naturalCollator.compare(a, b)), [visible]);
  const people = useMemo(() => unique(visible.flatMap((slot) => (slot.schedules ?? []).map((item) => item.participant_name))), [visible]);
  const pickerSlots = useMemo(() => data.slots.filter((slot) => memberNameMatches(slot.member_name, pickerQuery)), [data.slots, pickerQuery]);
  const pickerGroups = useMemo(() => TICKET_TABS.map((type) => [type, pickerSlots.filter((slot) => slot.ticket_type === type)]), [pickerSlots]);
  const pickerVisible = pickerGroups.find(([type]) => type === pickerTicket)?.[1] ?? [];

  function openInput(slotId) {
    const slot = data.slots.find((item) => item.id === slotId);
    setSelected(slotId ? [slotId] : []); setPickerQuery(""); setFeedback("");
    setPickerTicket(slot?.ticket_type ?? ticket);
    dialogRef.current?.showModal();
  }

  function toggleSlot(slotId) {
    setSelected((current) => current.includes(slotId) ? current.filter((id) => id !== slotId) : [...current, slotId]);
  }

  function closeOnBackdrop(event) {
    const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) event.currentTarget.close();
  }

  async function importCsv(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = parseScheduleCsv(await file.text(), data.slots, data.event?.event_date);
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
        <div className="workspace-heading"><div><h1 id="schedule-title">{data.event?.name ?? "Jadwal event"}</h1><p>{data.event ? [data.event.event_date && new Date(`${data.event.event_date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), data.event.venue].filter(Boolean).join(" · ") : "2-Shot dan Meet & Greet"}</p></div><span className="refresh-status"><i aria-hidden="true" />{lastUpdated ? `Diperbarui ${lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Memuat pembaruan"}</span></div>

        <div className="schedule-tabs" role="tablist" aria-label="Tipe tiket">
          {TICKET_TABS.map((value) => <button key={value} role="tab" aria-selected={ticket === value} aria-controls="session-cards" onClick={() => { setTicket(value); setSession(ALL); setMemberFilter(ALL_MEMBERS); setFriendFilter(ALL_FRIENDS); }}>{value}<span>{unique(data.slots.filter((slot) => slot.ticket_type === value).map((slot) => slot.session_label)).length} sesi</span></button>)}
        </div>

        <div className="filters schedule-filters" aria-label="Filter jadwal">
          <label><span>Sesi</span><select value={session} onChange={(event) => setSession(event.target.value)}><option>{ALL}</option>{sessions.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Member</span><select aria-label="Member" value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)}><option>{ALL_MEMBERS}</option>{members.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Teman</span><select aria-label="Teman" value={friendFilter} onChange={(event) => setFriendFilter(event.target.value)}><option>{ALL_FRIENDS}</option>{friends.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="presence-filter"><input type="checkbox" checked={withFriendsOnly} onChange={(event) => setWithFriendsOnly(event.target.checked)} /><span>Hanya yang ada teman</span></label>
          <output className="visible-count" aria-live="polite">{people.length ? `${people.length} teman terlihat` : "Belum ada teman"}</output>
        </div>

        {data.loading ? <div className="state-panel" role="status">Memuat jadwal…</div>
          : !data.configured ? <div className="state-panel"><strong>Sambungkan Supabase untuk menampilkan jadwal.</strong><p>Salin <code>.env.example</code> menjadi <code>.env.local</code>, lalu isi kredensial proyek.</p></div>
          : data.error ? <div className="state-panel error-text"><strong>Jadwal gagal dimuat.</strong><p>{data.error}</p><button className="secondary-button" onClick={load}>Coba lagi</button></div>
          : !data.event ? <div className="state-panel"><strong>Belum ada event aktif.</strong><p>Aktifkan satu event dari Supabase, lalu sinkronkan sumbernya.</p></div>
          : !grouped.length ? <div className="state-panel"><strong>Tidak ada jadwal yang cocok.</strong><p>Ubah filter atau kata pencarian.</p></div>
          : <div className="session-list" id="session-cards" role="tabpanel" aria-label={ticket}>{grouped.map(([sessionName, slots]) => <section className="session-group" key={sessionName}><header className="session-label"><div><h3>{sessionName}</h3><span>{ticket}</span></div><span>{slots.length} member</span></header><div className="member-grid">{slots.map((slot) => <article className="member-card" key={slot.id}><span className="lane-label">{slot.lane_label || "Jalur menyusul"}</span><MemberPhoto slot={slot} /><div className="slot-member"><h4>{slot.member_name}</h4><span>{slot.group_name}</span></div><div className="slot-people"><small>{slot.schedules?.length ? `${slot.schedules.length} teman di sesi ini` : "Belum ada teman"}</small>{slot.schedules?.map((item) => <span key={item.id}>{item.participant_name}</span>)}</div><button className="add-slot" aria-label={`Ikut jadwal ${slot.member_name}, ${sessionName}`} onClick={() => openInput(slot.id)}>+ Ikut sesi</button></article>)}</div></section>)}</div>}
      </section>
    </main>

    <footer className="site-footer"><div className="footer-inner"><span>Developed by <a href="https://x.com/estrellawin19" target="_blank" rel="noopener noreferrer">@estrellawin19</a></span><a className="tako-link" href="https://tako.id/Sportagame19Win" target="_blank" rel="noopener noreferrer">Support project ↗</a></div></footer>

    <dialog className="input-dialog" ref={dialogRef} onClick={closeOnBackdrop} onClose={() => setFeedback("")}>
      <form method="dialog" className="dialog-top"><div><span>Isi jadwal</span><h2>Pilih sesi</h2></div><button className="dialog-close" aria-label="Tutup">×</button></form>
      <div className="mode-tabs" role="tablist" aria-label="Cara input"><button role="tab" aria-selected={mode === "manual"} onClick={() => setMode("manual")}>Pilih manual</button><button role="tab" aria-selected={mode === "csv"} onClick={() => setMode("csv")}>Impor CSV</button></div>
      <form className="input-form" onSubmit={save}>
        <label><span>Nama kamu</span><input value={name} onChange={(event) => setName(event.target.value)} minLength={PARTICIPANT_NAME_MIN} maxLength={PARTICIPANT_NAME_MAX} autoComplete="name" placeholder="Nama panggilan" required /><small>{name.length}/{PARTICIPANT_NAME_MAX} karakter</small></label>
        {mode === "csv" ? <div className="csv-box"><div className="csv-guide"><strong>Gunakan JKT48 Schedule Recap</strong><ol><li>Pasang dan jalankan ekstensi <a href="https://chromewebstore.google.com/detail/jkt48-schedule-recap/amkifnihmncpgmnjaojdmcohmnpalbki" target="_blank" rel="noopener noreferrer">JKT48 Schedule Recap</a>.</li><li>Ekspor CSV dari ekstensi, lalu unggah file lengkapnya di sini.</li><li>Tiket untuk {data.event?.event_date ?? "tanggal event"} akan dipilih otomatis; jalur mengikuti jadwal aplikasi.</li></ol></div><div className="csv-actions"><label className="file-button"><input type="file" accept=".csv,text/csv" onChange={importCsv} />Pilih CSV hasil ekspor</label></div><small>CSV harus berasal dari ekstensi JKT48 Schedule Recap.</small></div>
          : <div className="manual-picker"><label className="picker-search"><span>Cari member</span><input type="search" value={pickerQuery} onChange={(event) => setPickerQuery(event.target.value)} placeholder="Nama lengkap atau nickname…" /></label><div className="picker-ticket-tabs" role="tablist" aria-label="Tipe tiket pilihan manual">{pickerGroups.map(([type, slots]) => <button type="button" role="tab" aria-selected={pickerTicket === type} key={type} onClick={() => setPickerTicket(type)}>{type}<span>{slots.length}</span></button>)}</div><fieldset className="slot-picker"><legend>Pilih jadwal <span>{selected.length} dipilih · {pickerVisible.length} hasil</span></legend>{pickerVisible.map((slot) => <label key={slot.id}><input type="checkbox" checked={selected.includes(slot.id)} onChange={() => toggleSlot(slot.id)} /><span><strong>{slot.member_name}</strong><small>{slot.session_label} · {slot.lane_label || "Jalur menyusul"} · {slot.group_name}</small></span></label>)}{!pickerVisible.length && <p className="slot-picker-empty">Tidak ada member yang cocok.</p>}</fieldset></div>}
        <p className="form-feedback" role="status">{feedback}</p>
        <button className="primary-button submit-button" disabled={saving || selected.length === 0 || name.trim().length < PARTICIPANT_NAME_MIN || name.trim().length > PARTICIPANT_NAME_MAX}>{saving ? "Menyimpan…" : `Simpan ${selected.length || ""} jadwal`}</button>
      </form>
    </dialog>
  </>;
}
