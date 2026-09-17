import "@fontsource-variable/bricolage-grotesque";
import "../tokens.css";
import "./globals.css";

export const metadata = {
  title: "SRS · Jadwal 2-Shot & Meet and Greet",
  description: "Lihat jadwal per sesi dan isi jadwalmu.",
};

const themeScript = `(function(){try{var saved=localStorage.getItem("theme");var theme=saved||(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=theme;}catch(e){}})()`;

export default function RootLayout({ children }) {
  return <html lang="id" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>{children}</body></html>;
}
