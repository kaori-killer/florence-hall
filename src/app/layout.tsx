import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Header } from "./components/Header";
import { SkipLink } from "./components/SkipLink";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Florence Hall — 좌석 예매",
  description: "동시에 같은 좌석을 누른 두 사람 중 한 명만 성공합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SkipLink />
        <Header />
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 focus:outline-none"
        >
          {children}
        </main>
        <footer className="border-t border-line bg-background">
          <div className="max-w-5xl mx-auto px-6 py-5 text-xs font-medium text-muted">
            202101248 유소정
          </div>
        </footer>
      </body>
    </html>
  );
}
