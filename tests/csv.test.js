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

test("CSV melaporkan baris yang tidak ditemukan", () => {
  const result = parseScheduleCsv("Member,Sesi,Tipe Tiket\nTidak Ada,Sesi 1,2-Shot", []);
  assert.deepEqual(result.slotIds, []);
  assert.deepEqual(result.unmatched, ["Tidak Ada"]);
});
