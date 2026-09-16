import test from "node:test";
import assert from "node:assert/strict";
import { memberPhotoUrl } from "../lib/member-photos.js";

test("foto member memakai alias JKT48 dan fallback untuk grup lain", () => {
  assert.match(memberPhotoUrl("Freya", "JKT48"), /freya_jayawardana\.jpg/);
  assert.match(memberPhotoUrl("Maxine Faye", "JKT48"), /maxine_faye_lee\.jpg/);
  assert.equal(memberPhotoUrl("Erii", "AKB48"), null);
});
