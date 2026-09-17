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

test("foto member memakai sumber resmi sesuai grup", () => {
  assert.match(memberPhotoUrl("Freya", "JKT48"), /freya_jayawardana\.jpg/);
  assert.match(memberPhotoUrl("Maxine Faye", "JKT48"), /maxine_faye_lee\.jpg/);
  assert.match(memberPhotoUrl("Erii", "AKB48"), /83100927\.jpg/);
  assert.match(memberPhotoUrl("Yuiyui", "AKB48"), /83100816\.jpg/);
  assert.match(memberPhotoUrl("Suzuha", "AKB48"), /83100952\.jpg/);
  assert.match(memberPhotoUrl("Mizumin", "AKB48"), /83101007\.jpg/);
  assert.match(memberPhotoUrl("Kohi", "AKB48"), /83101014\.jpg/);
  assert.equal(memberPhotoUrl("Tidak Ada", "AKB48"), null);
  assert.equal(memberPhotoUrl("Erii", "OTHER"), null);
});
