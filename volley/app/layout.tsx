import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { AppProvider } from "@/components/AppProvider";
import Gate from "@/components/Gate";

export const metadata: Metadata = {
  title: "Volley · Équipes",
  description: "Indique ta présence aux séances et obtiens des équipes équilibrées en un clic.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f3f5f9" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh">
        <AppProvider>
          <Nav />
          <main className="mx-auto max-w-3xl px-4 pb-28 pt-6 sm:pb-12">
            <Gate>{children}</Gate>
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
