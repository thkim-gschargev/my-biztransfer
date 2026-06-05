import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { ConditionalShell } from "@/components/layout/conditional-shell";
import { Toaster } from "@/components/ui/toaster";

// 라이트 우선: 저장된 선택이 있으면 따르고, 없으면 라이트로 시작한다.
const THEME_INIT_SCRIPT = `(()=>{try{const s=localStorage.getItem("bt-theme");if(s==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "양수도 사업 관제판",
  description: "EV 충전기 운영권 양수도 체크리스트 및 업무 진행 현황 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <ConditionalShell>{children}</ConditionalShell>
        <Toaster />
      </body>
    </html>
  );
}
