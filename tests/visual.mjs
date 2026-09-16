import { chromium } from "playwright-core";

const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true });
const slots = [
  { id: "1", session_label: "Sesi 1", lane_label: "Jalur 3", member_name: "Freya", group_name: "JKT48", ticket_type: "Meet & Greet", schedules: [{ id: "a", participant_name: "Sergio" }, { id: "b", participant_name: "Raka" }] },
  { id: "2", session_label: "Sesi 1", lane_label: "Jalur 8", member_name: "Erii", group_name: "AKB48", ticket_type: "2-Shot", schedules: [{ id: "c", participant_name: "Nadia" }] },
  { id: "3", session_label: "Sesi 2", lane_label: "Jalur 5", member_name: "Fiony", group_name: "JKT48", ticket_type: "2-Shot", schedules: [] },
  { id: "4", session_label: "Sesi 1", lane_label: "Jalur 2", member_name: "Gracie", group_name: "JKT48", ticket_type: "2-Shot", schedules: [{ id: "d", participant_name: "Raka" }] },
  { id: "5", session_label: "Sesi 2", lane_label: "Jalur 7", member_name: "Ekin", group_name: "JKT48", ticket_type: "2-Shot", schedules: [{ id: "e", participant_name: "Sergio" }] },
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
  await page.route("https://wsrv.nl/**", (route) => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" fill="#ead9d2"/><circle cx="90" cy="70" r="42" fill="#d6a68f"/><path d="M35 180c5-48 105-48 110 0" fill="#a52a22"/><path d="M48 62c8-51 79-55 88 2-28-5-54-22-88-2" fill="#251a17"/></svg>' }));
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  if (await page.getByRole("button", { name: "Isi jadwal", exact: true }).count() !== 1) throw new Error(`${name}: tombol Isi jadwal terduplikasi.`);
  const firstSessionLanes = await page.locator(".session-group").first().locator(".lane-label").allTextContents();
  if (firstSessionLanes.join(",") !== "Jalur 2,Jalur 8") throw new Error(`${name}: urutan jalur tidak natural (${firstSessionLanes.join(", ")})`);
  if (name === "reduced-motion") {
    await page.getByRole("button", { name: "Gunakan tema gelap" }).click();
    if (await page.locator("html").getAttribute("data-theme") !== "dark") throw new Error("Toggle tema tidak mengaktifkan mode gelap.");
    if (await page.evaluate(() => localStorage.getItem("theme")) !== "dark") throw new Error("Pilihan tema tidak tersimpan.");
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`${name}: overflow horizontal ${overflow}px`);
  await page.screenshot({ path: `scrollcraft/builds/ayo-senyumlah/${name}.png`, fullPage: true });
  if (name === "desktop-data") {
    await page.getByRole("tab", { name: /Meet & Greet/ }).click();
    const cards = page.locator("#session-cards");
    if (!await cards.getByText("Freya", { exact: true }).isVisible() || await cards.getByText("Erii", { exact: true }).isVisible()) throw new Error("Tab Meet & Greet tidak memfilter jadwal.");
  }
  if (name === "mobile-375-data") {
    await page.getByRole("button", { name: "Isi jadwal", exact: true }).click();
    await page.getByLabel("Nama kamu").fill("Sergio");
    await page.getByLabel("Cari member", { exact: true }).fill("Fiony");
    const picker = page.locator(".slot-picker");
    if (!await picker.getByText("Fiony", { exact: true }).isVisible() || await picker.getByText("Erii", { exact: true }).isVisible()) throw new Error("Pencarian member di dialog tidak memfilter jadwal.");
    await page.screenshot({ path: "scrollcraft/builds/ayo-senyumlah/mobile-dialog.png" });
    await page.keyboard.press("Escape");
  }
  await page.close();
}

await browser.close();
if (consoleErrors.length) throw new Error(consoleErrors.join("\n"));
console.log("Visual check passed: 6 viewports, no horizontal overflow or console errors.");
