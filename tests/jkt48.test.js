import test from "node:test";
import assert from "node:assert/strict";
import { buildJkt48Cookie, jkt48RequestHeaders, parseBonusPayload } from "../lib/jkt48.js";

test("payload bonus menjadi slot yang stabil", () => {
  const slots = parseBonusPayload({ data: [{ label: "Sesi 1", session_members: [{ member_name: "Freya", label: "Jalur 3" }] }] });
  assert.deepEqual(slots, [{ source_key: "sesi-1:freya", session_label: "Sesi 1", member_name: "Freya", lane_label: "Jalur 3" }]);
});

test("payload kosong ditolak agar cache lama tidak terhapus", () => {
  assert.throws(() => parseBonusPayload({}), /Format API/);
});

test("cookie Waiting Room dibentuk seperti dashboard-ex48", () => {
  assert.match(buildJkt48Cookie("token=="), /^__cfwaitingroom_.+=token==$/);
  assert.equal(buildJkt48Cookie("__cfwaitingroom_custom=token=="), "__cfwaitingroom_custom=token==");
  assert.equal(jkt48RequestHeaders("cookie=value").Cookie, "cookie=value");
  assert.throws(() => buildJkt48Cookie("bad;cookie"), /tidak valid/);
});
