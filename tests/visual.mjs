import { chromium } from "playwright-core";

const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true });
const slots = [
  { id: "1", session_label: "Sesi 1", lane_label: "Jalur 3", member_name: "Freya", group_name: "JKT48", ticket_type: "Meet & Greet", schedules: [{ id: "a", participant_name: "Sergio" }, { id: "b", participant_name: "Raka" }] },
  { id: "2", session_label: "Sesi 1", lane_label: "Jalur 8", member_name: "Erii", group_name: "AKB48", ticket_type: "2-Shot", schedules: [{ id: "c", participant_name: "Nadia" }] },
  { id: "3", session_label: "Sesi 2", lane_label: "Jalur 5", member_name: "Fiony", group_name: "JKT48", ticket_type: "2-Shot", schedules: [] },
  { id: "4", session_label: "Sesi 1", lane_label: "Jalur 2", member_name: "Gracie", group_name: "JKT48", ticket_type: "2-Shot", schedules: [{ id: "d", participant_name: "Raka" }] },
  { id: "5", session_label: "Sesi 2", lane_label: "Jalur 7", member_name: "Jacqueline Immanuela", group_name: "JKT48", ticket_type: "2-Shot", schedules: [{ id: "e", participant_name: "Sergio" }] },
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
  if (!await page.getByRole("img", { name: "Logo Sumber Rezeki" }).isVisible()) throw new Error(`${name}: logo komunitas tidak terlihat.`);
  if (await page.getByRole("link", { name: "Jadwal", exact: true }).count() || await page.getByRole("link", { name: "Admin", exact: true }).count()) throw new Error(`${name}: tautan Jadwal/Admin masih terlihat.`);
  if (!await page.getByRole("link", { name: "@estrellawin19" }).isVisible() || !await page.getByRole("link", { name: "Support project ↗" }).isVisible()) throw new Error(`${name}: credit atau tautan Tako tidak terlihat.`);
  const firstSessionLanes = await page.locator(".session-group").first().locator(".lane-label").allTextContents();
  if (firstSessionLanes.join(",") !== "Jalur 2,Jalur 8") throw new Error(`${name}: urutan jalur tidak natural (${firstSessionLanes.join(", ")})`);
  if (name === "reduced-motion") {
    await page.getByRole("button", { name: "Gunakan tema gelap" }).click();
    if (await page.locator("html").getAttribute("data-theme") !== "dark") throw new Error("Toggle tema tidak mengaktifkan mode gelap.");
    if (await page.locator("html").evaluate((element) => getComputedStyle(element).colorScheme) !== "dark") throw new Error("Kontrol native tidak mengikuti mode gelap.");
    if (await page.evaluate(() => localStorage.getItem("theme")) !== "dark") throw new Error("Pilihan tema tidak tersimpan.");
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`${name}: overflow horizontal ${overflow}px`);
  await page.screenshot({ path: `scrollcraft/builds/ayo-senyumlah/${name}.png`, fullPage: true });
  if (name === "desktop-data") {
    const refreshed = page.waitForResponse((response) => response.url().includes("/api/timetable"));
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await refreshed;
    if (!await page.getByText(/Diperbarui \d{2}[.:]\d{2}[.:]\d{2}/).isVisible()) throw new Error("Status auto-refresh tidak terlihat.");
    await page.getByLabel("Hanya yang ada teman").check();
    const filteredCards = page.locator("#session-cards");
    if (await filteredCards.getByText("Fiony", { exact: true }).isVisible() || !await filteredCards.getByText("Jacqueline Immanuela", { exact: true }).isVisible()) throw new Error("Filter teman tidak menyembunyikan sesi kosong.");
    await page.getByRole("tab", { name: /Meet & Greet/ }).click();
    const cards = page.locator("#session-cards");
    if (!await cards.getByText("Freya", { exact: true }).isVisible() || await cards.getByText("Erii", { exact: true }).isVisible()) throw new Error("Tab Meet & Greet tidak memfilter jadwal.");
  }
  if (name === "mobile-375-data") {
    await page.getByRole("button", { name: "Isi jadwal", exact: true }).click();
    const nameInput = page.getByLabel("Nama kamu");
    await nameInput.pressSequentially("a".repeat(41));
    if ((await nameInput.inputValue()).length !== 40) throw new Error("Batas 40 karakter nama tidak diterapkan.");
    await nameInput.fill("Sergio");
    const picker = page.locator(".slot-picker");
    const ticketTabs = page.getByRole("tablist", { name: "Tipe tiket pilihan manual" });
    if (!await ticketTabs.getByRole("tab", { name: /2-Shot/ }).isVisible() || !await ticketTabs.getByRole("tab", { name: /Meet & Greet/ }).isVisible()) throw new Error("Pilihan manual belum dipisahkan berdasarkan tipe tiket.");
    await ticketTabs.getByRole("tab", { name: /Meet & Greet/ }).click();
    if (!await picker.getByText("Freya", { exact: true }).isVisible() || await picker.getByText("Erii", { exact: true }).isVisible()) throw new Error("Tab Meet & Greet pada pilihan manual tidak bekerja.");
    await ticketTabs.getByRole("tab", { name: /2-Shot/ }).click();
    await page.screenshot({ path: "scrollcraft/builds/ayo-senyumlah/mobile-manual-dialog.png" });
    await page.getByLabel("Cari member", { exact: true }).fill("Ekin");
    if (!await picker.getByText("Jacqueline Immanuela", { exact: true }).isVisible()) throw new Error("Pencarian nickname tidak menemukan nama lengkap member.");
    await page.getByLabel("Cari member", { exact: true }).fill("Fiony");
    if (!await picker.getByText("Fiony", { exact: true }).isVisible() || await picker.getByText("Erii", { exact: true }).isVisible()) throw new Error("Pencarian member di dialog tidak memfilter jadwal.");
    await page.getByRole("tab", { name: "Impor CSV" }).click();
    if (!await page.getByText("Ganti atau hapus baris contoh", { exact: false }).isVisible()) throw new Error("Petunjuk CSV tidak terlihat.");
    await page.screenshot({ path: "scrollcraft/builds/ayo-senyumlah/mobile-dialog.png" });
    await page.mouse.click(2, 400);
    if (await page.locator(".input-dialog").isVisible()) throw new Error("Klik backdrop tidak menutup dialog.");
  }
  await page.close();
}

const adminCalls = [];
const adminPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
adminPage.on("console", (message) => { if (message.type() === "error") consoleErrors.push(`admin: ${message.text()}`); });
await adminPage.route("**/api/admin/status", (route) => route.fulfill({ json: { authenticated: true, event: { id: "event-1", name: "Festival Oktober", event_date: "2026-10-24" }, sources: [], slots } }));
await adminPage.route("**/api/admin/schedules", async (route) => {
  adminCalls.push({ method: route.request().method(), body: route.request().postDataJSON() });
  await route.fulfill({ json: { ok: true } });
});
await adminPage.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });
if (!await adminPage.getByRole("heading", { name: "Kelola data" }).isVisible()) throw new Error("Halaman CRUD admin tidak terlihat.");
await adminPage.getByLabel("Nama peserta").fill("Dimas");
await adminPage.locator(".admin-schedule-form select").selectOption("2");
await adminPage.getByRole("button", { name: "Tambah jadwal" }).click();
await adminPage.locator(".admin-schedule-row").first().getByRole("button", { name: "Edit" }).click();
await adminPage.getByLabel("Nama peserta").fill("Sergio Baru");
await adminPage.getByRole("button", { name: "Simpan perubahan" }).click();
adminPage.once("dialog", (dialog) => dialog.accept());
await adminPage.locator(".admin-schedule-row").first().getByRole("button", { name: "Hapus" }).click();
if (adminCalls.map((call) => call.method).join(",") !== "POST,PATCH,DELETE") throw new Error(`CRUD admin tidak lengkap: ${adminCalls.map((call) => call.method).join(",")}`);
await adminPage.screenshot({ path: "scrollcraft/builds/ayo-senyumlah/admin-crud.png", fullPage: true });
await adminPage.close();

const saveFailurePage = await browser.newPage({ viewport: { width: 375, height: 900 } });
await saveFailurePage.route("**/api/timetable", (route) => route.fulfill({ json: { configured: true, event: { name: "Festival Oktober" }, slots } }));
await saveFailurePage.route("**/api/schedules", (route) => route.fulfill({ status: 500, contentType: "text/plain", body: 'duplicate key value violates constraint "secret"' }));
await saveFailurePage.goto("http://localhost:3000", { waitUntil: "networkidle" });
await saveFailurePage.getByRole("button", { name: "Isi jadwal", exact: true }).click();
await saveFailurePage.getByLabel("Nama kamu").fill("Sergio");
await saveFailurePage.locator(".slot-picker input[type=checkbox]").first().check();
await saveFailurePage.getByRole("button", { name: /Simpan 1 jadwal/ }).click();
await saveFailurePage.getByText("Jadwal belum tersimpan. Coba lagi.", { exact: true }).waitFor();
const saveError = await saveFailurePage.locator(".form-feedback").textContent();
if (!saveError.includes("Jadwal belum tersimpan") || saveError.includes("constraint")) throw new Error(`Error simpan tidak aman: ${saveError}`);
await saveFailurePage.close();

const loadFailurePage = await browser.newPage({ viewport: { width: 375, height: 900 } });
await loadFailurePage.route("**/api/timetable", (route) => route.fulfill({ status: 500, contentType: "text/html", body: "<h1>database password leaked</h1>" }));
await loadFailurePage.goto("http://localhost:3000", { waitUntil: "networkidle" });
if (!await loadFailurePage.getByRole("button", { name: "Coba lagi" }).isVisible() || await loadFailurePage.getByText("database password leaked").count()) throw new Error("Error pemuatan jadwal tidak ditangani dengan aman.");
await loadFailurePage.close();

const adminFailurePage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await adminFailurePage.route("**/api/admin/status", (route) => route.fulfill({ status: 500, contentType: "text/plain", body: "SQL connection string" }));
await adminFailurePage.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });
if (!await adminFailurePage.getByText("Data admin gagal dimuat.", { exact: true }).isVisible() || await adminFailurePage.getByText("SQL connection string").count()) throw new Error("Error pemuatan admin tidak ditangani dengan aman.");
await adminFailurePage.close();

await browser.close();
if (consoleErrors.length) throw new Error(consoleErrors.join("\n"));
console.log("Visual check passed: 6 viewports, admin CRUD, and safe error states.");
