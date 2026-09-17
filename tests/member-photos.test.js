import test from "node:test";
import assert from "node:assert/strict";
import { canonicalMemberName, memberNameMatches, memberPhotoUrl } from "../lib/member-photos.js";

test("nickname dikenali sebagai identitas member", () => {
  assert.equal(canonicalMemberName("Ekin"), "jacqueline immanuela");
  assert.equal(memberNameMatches("Jacqueline Immanuela", "eki"), true);
  assert.equal(memberNameMatches("Michelle Alexandra", "michie"), true);
  assert.equal(canonicalMemberName("Zukky"), "mizuki yamauchi");
  assert.equal(memberNameMatches("Mayuu Masai", "masaru"), true);
  assert.equal(memberNameMatches("Yuki Hirata", "yukinee"), true);
});

test("foto member memakai alias JKT48 dan fallback untuk grup lain", () => {
  assert.match(memberPhotoUrl("Freya", "JKT48"), /freya_jayawardana\.jpg/);
  assert.match(memberPhotoUrl("Maxine Faye", "JKT48"), /maxine_faye_lee\.jpg/);
  assert.equal(memberPhotoUrl("Erii", "AKB48"), null);
});
