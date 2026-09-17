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

export function parseScheduleCsv(text, slots) {
  const parsed = rows(text.replace(/^\uFEFF/, ""));
  if (!parsed.length) throw new Error("CSV kosong.");
  const headers = parsed[0].map(norm);
  const indexes = CSV_COLUMNS.map((name) => headers.indexOf(norm(name)));
  if (indexes.some((index) => index < 0)) throw new Error(`Kolom wajib: ${CSV_COLUMNS.join(", ")}.`);

  const selected = new Set();
  const unmatched = [];
  for (const line of parsed.slice(1)) {
    const [member, session, ticket] = indexes.map((index) => norm(line[index]));
    const found = slots.find((slot) => canonicalMemberName(slot.member_name) === canonicalMemberName(member)
      && norm(slot.session_label) === session
      && norm(slot.ticket_type) === ticket);
    if (found) selected.add(found.id);
    else unmatched.push(line[indexes[0]] || `Baris ${unmatched.length + 2}`);
  }
  return { slotIds: [...selected], unmatched };
}
