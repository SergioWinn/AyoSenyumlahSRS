import test from "node:test";
import assert from "node:assert/strict";
import { buildScheduleCsvTemplate, parseScheduleCsv } from "../lib/csv.js";

test("template CSV memakai contoh aktual yang tetap bisa diimpor", () => {
  const slots = [{ id: "slot-1", member_name: "Member, Satu", session_label: "Sesi 1", lane_label: "Jalur 2", ticket_type: "Meet & Greet" }];
  const template = buildScheduleCsvTemplate(slots);
  assert.match(template, /"Member, Satu","Sesi 1","Jalur 2","Meet & Greet"/);
  assert.deepEqual(parseScheduleCsv(template, slots), { slotIds: ["slot-1"], unmatched: [] });
});

test("CSV menangani kutip dan mencocokkan jadwal tanpa peka huruf", () => {
  const slots = [{ id: "slot-1", member_name: "Member, Satu", session_label: "Sesi 1", lane_label: "Jalur 2", ticket_type: "Meet & Greet" }];
  const result = parseScheduleCsv('Member,Sesi,Jalur,Tipe Tiket\n"Member, Satu",sesi 1,jalur 2,Meet & Greet', slots);
  assert.deepEqual(result, { slotIds: ["slot-1"], unmatched: [] });
});

test("CSV melaporkan baris yang tidak ditemukan", () => {
  const result = parseScheduleCsv("Member,Sesi,Jalur,Tipe Tiket\nTidak Ada,Sesi 1,Jalur 1,2-Shot", []);
  assert.deepEqual(result.slotIds, []);
  assert.deepEqual(result.unmatched, ["Tidak Ada"]);
});
