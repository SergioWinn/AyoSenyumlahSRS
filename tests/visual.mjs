import { chromium } from "playwright-core";

const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true });
const slots = [
  { id: "1", session_label: "Sesi 1", lane_label: "Jalur 3", member_name: "Freya", group_name: "JKT48", ticket_type: "Meet & Greet", schedules: [{ id: "a", participant_name: "Sergio" }, { id: "b", participant_name: "Raka" }] },
  { id: "2", session_label: "Sesi 1", lane_label: "Jalur 8", member_name: "Erii", group_name: "AKB48", ticket_type: "2-Shot", schedules: [{ id: "c", participant_name: "Nadia" }] },
  { id: "3", session_label: "Sesi 2", lane_label: "Jalur 5", member_name: "Fiony", group_name: "JKT48", ticket_type: "2-Shot", schedules: [] },
];
const consoleErrors = [];

for (const { name, width, height, reducedMotion = "no-preference" } of [
  { name: "desktop-data", width: 1440, height: 1000 },
  { name: "mobile-320-data", width: 320, height: 780 },
  { name: "mobile-375-data", width: 375, height: 900 },
  { name: "mobile-414-data", width: 414, height: 900 },
  { name: "tablet-768-data", width: 768, height: 1024 },
  { name: "reduced-motion", width: 375, height: 900, reducedMotion: "reduce" },
]) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion });
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(`${name}: ${message.text()}`); });
  await page.route("**/api/timetable", (route) => route.fulfill({ json: { configured: true, event: { name: "Festival Oktober", event_date: "2026-10-24", venue: "Jakarta" }, slots } }));
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`${name}: overflow horizontal ${overflow}px`);
  await page.screenshot({ path: `scrollcraft/builds/ayo-senyumlah/${name}.png`, fullPage: true });
  if (name === "mobile-375-data") {
    await page.getByRole("button", { name: "Isi jadwal", exact: true }).click();
    await page.getByLabel("Nama kamu").fill("Sergio");
    await page.screenshot({ path: "scrollcraft/builds/ayo-senyumlah/mobile-dialog.png" });
    await page.keyboard.press("Escape");
  }
  await page.close();
}

await browser.close();
if (consoleErrors.length) throw new Error(consoleErrors.join("\n"));
console.log("Visual check passed: 6 viewports, no horizontal overflow or console errors.");
