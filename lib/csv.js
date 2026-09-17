import { canonicalMemberName } from "./member-photos.js";

export const CSV_COLUMNS = ["Member", "Sesi", "Tipe Tiket"];

export function buildScheduleCsvTemplate(slots) {
  const lines = [CSV_COLUMNS, ...slots.slice(0, 2).map((slot) => [slot.member_name, slot.session_label, slot.ticket_type])];
  return `\uFEFF${lines.map((line) => line.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n")}\r\n`;
}

function rows(text) {
  const out = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell.trim()); cell = "";
      if (row.some(Boolean)) out.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) out.push(row);
  if (quoted) throw new Error("Tanda kutip CSV belum ditutup.");
  return out;
}

function norm(value) {
  return String(value ?? "").trim().toLocaleLowerCase("id-ID").replace(/\s+/g, " ");
}

function sessionKey(value) {
  return norm(value).replace(/^session\b/, "sesi");
}

function ticketKey(value) {
  return norm(value).replace(/[^a-z0-9]/g, "");
}

export function parseScheduleCsv(text, slots, eventDate) {
  const parsed = rows(text.replace(/^\uFEFF/, ""));
  if (!parsed.length) throw new Error("CSV kosong.");
  const headers = parsed[0].map(norm);
  const recapColumns = ["Date", "Session", "Type", "Member or Event"];
  const recapIndexes = recapColumns.map((name) => headers.indexOf(norm(name)));
  const isRecap = recapIndexes.every((index) => index >= 0);
  const indexes = isRecap ? [recapIndexes[3], recapIndexes[1], recapIndexes[2]] : CSV_COLUMNS.map((name) => headers.indexOf(norm(name)));
  if (indexes.some((index) => index < 0)) throw new Error(`Kolom wajib: ${CSV_COLUMNS.join(", ")}.`);
  if (isRecap && !eventDate) throw new Error("Tanggal event belum tersedia untuk memfilter CSV rekap.");

  const selected = new Set();
  const unmatched = [];
  const lines = isRecap ? parsed.slice(1).filter((line) => line[recapIndexes[0]] === eventDate && ["2shot", "meetgreet"].includes(ticketKey(line[recapIndexes[2]]))) : parsed.slice(1);
  if (isRecap && !lines.length) throw new Error(`Tidak ada tiket 2-Shot atau Meet & Greet pada ${eventDate}.`);
  for (const line of lines) {
    const member = norm(line[indexes[0]]);
    const session = sessionKey(line[indexes[1]]);
    const ticket = ticketKey(line[indexes[2]]);
    const found = slots.find((slot) => canonicalMemberName(slot.member_name) === canonicalMemberName(member)
      && sessionKey(slot.session_label) === session
      && ticketKey(slot.ticket_type) === ticket);
    if (found) selected.add(found.id);
    else unmatched.push(line[indexes[0]] || `Baris ${unmatched.length + 2}`);
  }
  return { slotIds: [...selected], unmatched };
}
