import type { Metadata } from "next";
import InsHeader from "@/components/insurid/InsHeader";
import InsFooter from "@/components/insurid/InsFooter";

export const metadata: Metadata = {
  title: {
    template: "%s | INSURID",
    default: "INSURID — 保険代理店のためのAI×海外情報メディア",
  },
  description:
    "海外ブローカー・代理店のAI事例、国内DX、規制動向を毎朝7:30に日本語で届ける、保険代理店向け専門メディア。",
};

export default function InsuridLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <InsHeader />
      <main className="flex-1">{children}</main>
      <InsFooter />
    </div>
  );
}
