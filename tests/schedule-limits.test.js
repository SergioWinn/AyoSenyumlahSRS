import test from "node:test";
import assert from "node:assert/strict";
import { participantNameIsValid } from "../lib/schedule-limits.js";

test("nama peserta mengikuti batas constraint database", () => {
  assert.equal(participantNameIsValid("A"), false);
  assert.equal(participantNameIsValid("A".repeat(40)), true);
  assert.equal(participantNameIsValid("A".repeat(41)), false);
});
