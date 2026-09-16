import test from "node:test";
import assert from "node:assert/strict";
import { saveSourceSnapshot } from "../lib/sync-source.js";

test("snapshot diteruskan ke RPC sebelum status sukses", async () => {
  const calls = [];
  const supabase = {
    rpc: async (name, args) => { calls.push({ name, args }); return { error: null }; },
    from: () => ({ update: (value) => ({ eq: async () => { calls.push({ update: value }); return { error: null }; } }) }),
  };
  const payload = { data: [{ label: "Sesi 1", session_members: [{ member_name: "Freya", label: "Jalur 3" }] }] };
  assert.equal(await saveSourceSnapshot(supabase, "source-1", payload), 1);
  assert.equal(calls[0].name, "sync_event_source");
  assert.equal(calls[0].args.p_payload, payload);
  assert.equal(calls[0].args.p_slots.length, 1);
  assert.equal(calls[1].update.sync_status, "success");
});

