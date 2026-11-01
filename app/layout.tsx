import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { AuthProvider } from "@/components/AuthProvider";
import Gate from "@/components/Gate";

export const metadata: Metadata = {
  title: "Dressing — ton styliste IA",
  description: "Numérise ta garde-robe, reçois chaque jour la bonne tenue selon la météo, l'occasion et ta morphologie.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f3f0ea" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh">
        <AuthProvider>
          <Nav />
          <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:pb-12">
            <Gate>{children}</Gate>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
