import test from "node:test";
import assert from "node:assert/strict";
import { buildScheduleCsvTemplate, parseScheduleCsv } from "../lib/csv.js";

test("template CSV memakai contoh aktual yang tetap bisa diimpor", () => {
  const slots = [{ id: "slot-1", member_name: "Member, Satu", session_label: "Sesi 1", lane_label: "Jalur 2", ticket_type: "Meet & Greet" }];
  const template = buildScheduleCsvTemplate(slots);
  assert.match(template, /"Member, Satu","Sesi 1","Meet & Greet"/);
  assert.doesNotMatch(template, /Jalur/);
  assert.deepEqual(parseScheduleCsv(template, slots), { slotIds: ["slot-1"], unmatched: [] });
});

test("CSV lama dengan kolom jalur tetap diterima", () => {
  const slots = [{ id: "slot-1", member_name: "Member, Satu", session_label: "Sesi 1", lane_label: "Jalur 2", ticket_type: "Meet & Greet" }];
  const result = parseScheduleCsv('Member,Sesi,Jalur,Tipe Tiket\n"Member, Satu",sesi 1,jalur 2,Meet & Greet', slots);
  assert.deepEqual(result, { slotIds: ["slot-1"], unmatched: [] });
});

test("CSV menerima nickname member", () => {
  const slots = [
    { id: "slot-1", member_name: "Jacqueline Immanuela", session_label: "Sesi 7", ticket_type: "2-Shot" },
    { id: "slot-2", member_name: "Erii Chiba", session_label: "Sesi 1", ticket_type: "Meet & Greet" },
  ];
  const result = parseScheduleCsv("Member,Sesi,Tipe Tiket\nEkin,Sesi 7,2-Shot\nErii,Sesi 1,Meet & Greet", slots);
  assert.deepEqual(result, { slotIds: ["slot-1", "slot-2"], unmatched: [] });
});

test("CSV JKT48 Schedule Recap hanya mengambil tanggal event", () => {
  const slots = [
    { id: "slot-1", member_name: "Angelina Christy", session_label: "Sesi 4", ticket_type: "2-Shot" },
    { id: "slot-2", member_name: "Fritzy Rosmerian", session_label: "Sesi 7", ticket_type: "2-Shot" },
  ];
  const csv = [
    '"Date","Session","Type","Member or Event"',
    '"2025-10-24","Sesi 4","2Shot","Angelina Christy"',
    '"2026-10-24","Sesi 4","2Shot","Angelina Christy"',
    '"2026-10-24","Sesi 7","2Shot","Fritzy Rosmerian"',
    '"2026-10-24","Session 1","Theater Show","JKT48 Theater"',
  ].join("\n");
  assert.deepEqual(parseScheduleCsv(csv, slots, "2026-10-24"), { slotIds: ["slot-1", "slot-2"], unmatched: [] });
});

test("CSV rekap memberi pesan jika tanggal event tidak ditemukan", () => {
  const csv = 'Date,Session,Type,Member or Event\n2025-10-24,Sesi 4,2Shot,Angelina Christy';
  assert.throws(() => parseScheduleCsv(csv, [], "2026-10-24"), /Tidak ada tiket.*2026-10-24/);
});

test("CSV melaporkan baris yang tidak ditemukan", () => {
  const result = parseScheduleCsv("Member,Sesi,Tipe Tiket\nTidak Ada,Sesi 1,2-Shot", []);
  assert.deepEqual(result.slotIds, []);
  assert.deepEqual(result.unmatched, ["Tidak Ada"]);
});
