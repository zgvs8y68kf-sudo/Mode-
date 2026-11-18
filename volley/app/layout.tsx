import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { AppProvider } from "@/components/AppProvider";
import Gate from "@/components/Gate";

export const metadata: Metadata = {
  title: "Volley · Équipes",
  description: "Indique ta présence aux séances et obtiens des équipes équilibrées en un clic.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#07090f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@500;600;700;800&display=swap" />
      </head>
      <body className="min-h-dvh">
        <AppProvider>
          <Nav />
          <main className="mx-auto max-w-3xl px-4 pb-28 pt-5 sm:pb-12">
            <Gate>{children}</Gate>
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
