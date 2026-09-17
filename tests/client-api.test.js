import test from "node:test";
import assert from "node:assert/strict";
import { requestJson } from "../lib/client-api.js";

test("requestJson menangani offline, status HTTP, dan respons bukan JSON", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });

  global.fetch = async () => { throw new Error("socket rahasia"); };
  await assert.rejects(requestJson("/test"), /Tidak dapat terhubung ke server/);

  global.fetch = async () => new Response("", { status: 429 });
  await assert.rejects(requestJson("/test"), (error) => error.status === 429 && /Terlalu banyak permintaan/.test(error.message));

  global.fetch = async () => new Response("SQL internal", { status: 500 });
  await assert.rejects(requestJson("/test", {}, "Data belum bisa dimuat."), /Data belum bisa dimuat/);

  global.fetch = async () => Response.json({ error: "Nama harus 2 sampai 40 karakter." }, { status: 400 });
  await assert.rejects(requestJson("/test"), /Nama harus 2 sampai 40 karakter/);
});
