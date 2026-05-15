import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TimelyOne — Instagram Prospecting",
  description: "Ferramenta de prospecção estratégica para o mercado de beleza no Instagram.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" className="dark">
      <body className={cn(inter.className, "min-h-screen bg-navy text-white antialiased")}>
        <main className="flex min-h-screen flex-col">
          {children}
        </main>
        <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
          <p>Esta ferramenta não envia mensagens automaticamente. Todos os contactos são feitos manualmente pelo utilizador.</p>
          <p className="mt-1">TimelyOne © {new Date().getFullYear()}</p>
        </footer>
      </body>
    </html>
  );
}
