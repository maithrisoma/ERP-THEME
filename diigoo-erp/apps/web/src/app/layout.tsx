import type { Metadata } from "next";
import { DM_Sans, DM_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-dm-sans", display: "swap" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  title: "Diigoo ERP — Human Resources",
  description: "Unified Retail & Commerce ERP — HRM module. Diigoo Tech Private Limited.",
};

// Applies the saved theme before paint to avoid a flash. Defaults to light
// (white-background portal) and only goes dark on an explicit saved choice.
const themeScript = `(function(){try{if(localStorage.getItem('diigoo-theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
