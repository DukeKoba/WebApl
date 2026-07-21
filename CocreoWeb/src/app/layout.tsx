import type { Metadata } from "next";
import { Noto_Sans_JP, Shippori_Mincho } from "next/font/google";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-sans",
  preload: false,
});

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-serif",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cocreo.jp"),
  title: "Cocreo | 保険代理店の経営課題を、現場で使われる仕組みへ",
  description:
    "保険代理店に特化したAI・DX伴走。経営課題の整理からWebサイト、業務アプリ、集客施策の実装・運用改善まで一気通貫で支援します。初回60分相談無料。",
  openGraph: {
    title: "Cocreo | 相談だけで終わらせない。現場で使われる仕組みまで。",
    description: "保険代理店に特化したAI・DX伴走。戦略から実装、運用改善まで一気通貫で支援します。",
    url: "https://cocreo.jp",
    siteName: "Cocreo",
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/cocreo-collaboration-hero.png", width: 1717, height: 916, alt: "Cocreoの伴走スタイル" }],
  },
  twitter: { card: "summary_large_image", images: ["/cocreo-collaboration-hero.png"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${notoSans.variable} ${shipporiMincho.variable}`}>
      <body className="bg-surface text-text-primary antialiased">
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
