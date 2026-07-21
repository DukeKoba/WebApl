import type { Metadata } from "next";
import NewsletterSignupClient from "./NewsletterSignupClient";

export const metadata: Metadata = {
  title: "メルマガ登録",
  description: "毎朝7:30、保険業界の最新AI動向・海外ブローカー事例を日本語でお届けします。",
};

export default function NewsletterPage() {
  return <NewsletterSignupClient />;
}
