import "@fontsource-variable/bricolage-grotesque";
import "../tokens.css";
import "./globals.css";

export const metadata = {
  title: "Ayo Senyumlah · Jadwal Barengan",
  description: "Lihat jadwal 2-Shot dan Meet & Greet komunitas dalam satu tempat.",
};

export default function RootLayout({ children }) {
  return <html lang="id"><body>{children}</body></html>;
}
