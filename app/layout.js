import "@fontsource-variable/bricolage-grotesque";
import "../tokens.css";
import "./globals.css";

export const metadata = {
  title: "Ayo Senyumlah · Jadwal Barengan",
  description: "Lihat jadwal 2-Shot dan Meet & Greet komunitas dalam satu tempat.",
};

const themeScript = `(function(){try{var saved=localStorage.getItem("theme");var theme=saved||(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=theme;}catch(e){}})()`;

export default function RootLayout({ children }) {
  return <html lang="id" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>{children}</body></html>;
}
