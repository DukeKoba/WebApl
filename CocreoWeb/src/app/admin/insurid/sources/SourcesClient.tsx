"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, Globe, Rss, Code2, MousePointerClick } from "lucide-react";
import type { Source } from "@/lib/insurid/types";

const KIND_ICONS: Record<string, React.ElementType> = {
  rss: Rss,
  api: Code2,
  scrape: MousePointerClick,
  manual: Globe,
};

const KIND_LABELS: Record<string, string> = {
  rss: "RSS",
  api: "API",
  scrape: "スクレイプ",
  manual: "手動",
};

const REGION_FLAGS: Record<string, string> = {
  us: "🇺🇸", uk: "🇬🇧", eu: "🇪🇺", asia: "🌏", jp: "🇯🇵", global: "🌐",
};

interface Props { initialSources: Source[] }

const EMPTY_FORM = {
  name: "", url: "", kind: "manual" as const, region: "global" as const,
  language: "en" as const, trust_score: 3,
};

export default function SourcesClient({ initialSources }: Props) {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = useCallback(async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/insurid/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newSource = await res.json();
      setSources((prev) => [newSource, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } else {
      const errData = await res.json();
      setError(errData.error ?? "エラー");
    }
    setSaving(false);
  }, [form]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("この情報源を削除しますか？")) return;
    await fetch(`/api/insurid/sources/${id}`, { method: "DELETE" });
    setSources((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleToggle = useCallback(async (source: Source) => {
    await fetch(`/api/insurid/sources/${source.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !source.active }),
    });
    setSources((prev) => prev.map((s) => s.id === source.id ? { ...s, active: !s.active } : s));
  }, []);

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-text-primary">情報源管理</h1>
          <p className="text-sm text-text-muted mt-0.5">{sources.length}件の情報源</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          情報源を追加
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-border rounded-xl p-4 mb-4 space-y-3">
          <p className="text-sm font-medium text-text-primary">新しい情報源</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-medium text-text-muted mb-1">名前</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Insurance Journal"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-medium text-text-muted mb-1">URL</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://www.insurancejournal.com/feed/"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">種別</label>
              <select
                value={form.kind}
                onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as typeof form.kind }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {Object.entries(KIND_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">地域</label>
              <select
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value as typeof form.region }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {Object.entries(REGION_FLAGS).map(([k, flag]) => (
                  <option key={k} value={k}>{flag} {k.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">言語</label>
              <select
                value={form.language}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value as typeof form.language }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">信頼スコア（1〜5）</label>
              <input
                type="number"
                min={1}
                max={5}
                value={form.trust_score}
                onChange={(e) => setForm((f) => ({ ...f, trust_score: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !form.name.trim() || !form.url.trim()}
              className="px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? "追加中..." : "追加"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-border text-sm text-text-secondary rounded-lg hover:bg-gray-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Source list */}
      {sources.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-sm">情報源が登録されていません</p>
          <p className="text-xs mt-1">「情報源を追加」からRSSフィードや記事URLを登録してください</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          {sources.map((source, i) => {
            const KindIcon = KIND_ICONS[source.kind] ?? Globe;
            return (
              <div
                key={source.id}
                className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""} ${!source.active ? "opacity-50" : ""}`}
              >
                <KindIcon className="w-4 h-4 text-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{source.name}</p>
                  <p className="text-xs text-text-muted truncate">{source.url}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-text-muted">{REGION_FLAGS[source.region]} {KIND_LABELS[source.kind]}</span>
                  <span className="text-[11px] text-amber-600">{"★".repeat(source.trust_score)}</span>
                  <button
                    onClick={() => handleToggle(source)}
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                      source.active
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {source.active ? "有効" : "無効"}
                  </button>
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
