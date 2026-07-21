"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, RefreshCw, Link2, Rss, CheckSquare, Square, Loader2, ExternalLink, ClipboardList, CheckCircle2, Zap } from "lucide-react";
import QueueCard from "@/components/insurid/admin/QueueCard";
import type { Draft } from "@/lib/insurid/types";
import type { RssItem } from "@/app/api/insurid/rss-fetch/route";

interface Props { initialDrafts: Draft[] }

type Tab = "rss" | "manual" | "queue";

export default function QueueClient({ initialDrafts }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("rss");

  // RSS
  const [rssItems, setRssItems]         = useState<RssItem[]>([]);
  const [rssLoading, setRssLoading]     = useState(false);
  const [rssError, setRssError]         = useState("");
  const [rssSource, setRssSource]       = useState("all");
  const [rssSources, setRssSources]     = useState<string[]>([]);
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading]   = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [generated, setGenerated]       = useState<Set<string>>(new Set());
  const [doneCount, setDoneCount]       = useState<number | null>(null);
  const [bulkErrors, setBulkErrors]     = useState<string[]>([]);
  const [autoPublish, setAutoPublish]   = useState(true);

  // Auto-collect state
  const [autoCollecting, setAutoCollecting] = useState(false);
  const [autoCollectResult, setAutoCollectResult] = useState<{ processed: number; errors: number } | null>(null);

  // Original generate state
  const [origGenerating, setOrigGenerating] = useState(false);
  const [origResult, setOrigResult] = useState<{ generated: number; errors: number } | null>(null);

  // Manual form
  const [addUrl, setAddUrl]         = useState("");
  const [addTitle, setAddTitle]     = useState("");
  const [addExcerpt, setAddExcerpt] = useState("");
  const [addError, setAddError]     = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/insurid/drafts");
    if (res.ok) setDrafts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "rss" && rssItems.length === 0) fetchRss();
  }, [tab]);

  const handleAutoCollect = useCallback(async () => {
    if (!confirm("全RSSソースから新着記事を取得し、AIで日本語化して自動公開します。続けますか？")) return;
    setAutoCollecting(true);
    setAutoCollectResult(null);
    try {
      const res = await fetch("/api/insurid/auto-collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_per_feed: 10 }),
      });
      const data = await res.json();
      setAutoCollectResult({ processed: data.processed ?? 0, errors: data.errors ?? 0 });
      if ((data.processed ?? 0) > 0) await refresh();
    } catch {
      setAutoCollectResult({ processed: 0, errors: 1 });
    } finally {
      setAutoCollecting(false);
    }
  }, [refresh]);

  const handleGenerateOriginal = useCallback(async () => {
    if (!confirm("AIがオリジナル解説記事を3本生成・公開します。続けますか？")) return;
    setOrigGenerating(true);
    setOrigResult(null);
    try {
      const res = await fetch("/api/insurid/generate-original", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 5 }),
      });
      const data = await res.json();
      setOrigResult({ generated: data.generated ?? 0, errors: data.errors ?? 0 });
      if ((data.generated ?? 0) > 0) await refresh();
    } catch {
      setOrigResult({ generated: 0, errors: 1 });
    } finally {
      setOrigGenerating(false);
    }
  }, [refresh]);

  // ── RSS ─────────────────────────────────────────────────────────────
  const fetchRss = useCallback(async (src = rssSource) => {
    setRssLoading(true);
    setRssError("");
    setSelected(new Set());
    setDoneCount(null);
    try {
      const res = await fetch(`/api/insurid/rss-fetch?source=${encodeURIComponent(src)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: RssItem[] = data.items;
      setRssItems(items);
      if (data.feeds?.length) setRssSources(data.feeds);

      // DB上で既に処理済みのURLを取得して生成済みセットに反映
      if (items.length > 0) {
        const checkRes = await fetch("/api/insurid/candidates/batch-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: items.map((i) => i.url) }),
        });
        if (checkRes.ok) {
          const map: Record<string, { state: string }> = await checkRes.json();
          const alreadyDone = new Set(
            Object.entries(map)
              .filter(([, v]) => v.state !== "new")
              .map(([url]) => url)
          );
          setGenerated(alreadyDone);
        }
      }
    } catch (e) {
      setRssError(e instanceof Error ? e.message : "取得失敗");
    } finally {
      setRssLoading(false);
    }
  }, [rssSource]);

  const toggleSelect = (url: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });

  const toggleAll = () => {
    const selectable = rssItems.filter((i) => !generated.has(i.url));
    const allSelected = selectable.length > 0 && selectable.every((i) => selected.has(i.url));
    setSelected(allSelected ? new Set() : new Set(selectable.map((i) => i.url)));
  };

  const generateFromRss = useCallback(async () => {
    const targets = rssItems.filter((i) => selected.has(i.url));
    if (!targets.length) return;
    setBulkLoading(true);
    setBulkProgress({ done: 0, total: targets.length });
    setDoneCount(null);
    setBulkErrors([]);

    let successCount = 0;
    const errors: string[] = [];
    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      try {
        const cRes = await fetch("/api/insurid/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: item.url, title_original: item.title, excerpt_original: item.excerpt }),
        });
        if (!cRes.ok) {
          const err = await cRes.json().catch(() => ({}));
          errors.push(`[candidate] ${item.title.slice(0, 30)}: ${err.error ?? cRes.status}`);
          setBulkProgress({ done: i + 1, total: targets.length });
          continue;
        }
        const candidate = await cRes.json();

        const dRes = await fetch("/api/insurid/draft/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidate_id: candidate.id, auto_publish: autoPublish }),
        });
        if (dRes.ok) {
          const draft = await dRes.json();
          if (!autoPublish) setDrafts((prev) => [draft, ...prev]);
          setGenerated((prev) => new Set([...prev, item.url]));
          successCount++;
        } else {
          const err = await dRes.json().catch(() => ({}));
          errors.push(`[draft] ${item.title.slice(0, 30)}: ${err.error ?? dRes.status}`);
        }
      } catch (e) {
        errors.push(`[exception] ${item.title.slice(0, 30)}: ${e instanceof Error ? e.message : String(e)}`);
      }
      setBulkProgress({ done: i + 1, total: targets.length });
    }

    setSelected(new Set());
    setBulkLoading(false);
    setBulkProgress(null);
    setDoneCount(successCount);
    setBulkErrors(errors);
  }, [rssItems, selected]);

  // ── Manual ──────────────────────────────────────────────────────────
  const handleAddAndGenerate = useCallback(async () => {
    if (!addUrl.trim()) return;
    setAddLoading(true);
    setAddError("");
    try {
      const cRes = await fetch("/api/insurid/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: addUrl.trim(), title_original: addTitle.trim(), excerpt_original: addExcerpt.trim() }),
      });
      if (!cRes.ok) throw new Error((await cRes.json()).error);
      const candidate = await cRes.json();

      const dRes = await fetch("/api/insurid/draft/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidate.id }),
      });
      if (!dRes.ok) throw new Error((await dRes.json()).error);
      const newDraft = await dRes.json();
      setDrafts((prev) => [newDraft, ...prev]);
      setAddUrl(""); setAddTitle(""); setAddExcerpt("");
      setTab("queue");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setAddLoading(false);
    }
  }, [addUrl, addTitle, addExcerpt]);

  // ── Queue actions ────────────────────────────────────────────────────
  const handleApprove = useCallback(async (id: string, paywall: "none" | "premium") => {
    const res = await fetch(`/api/insurid/draft/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paywall }),
    });
    if (res.ok) setDrafts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const handleReject = useCallback(async (id: string) => {
    const res = await fetch(`/api/insurid/draft/${id}/reject`, { method: "POST" });
    if (res.ok) setDrafts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const handleRegenerate = useCallback(async (id: string, instruction: string) => {
    const res = await fetch(`/api/insurid/draft/${id}/regenerate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction }),
    });
    if (res.ok) {
      const updated = await res.json();
      setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
    }
  }, []);

  const handleUpdate = useCallback(async (id: string, updates: Partial<Draft>) => {
    await fetch(`/api/insurid/draft/${id}/update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }, []);

  const tabClass = (t: Tab) =>
    `flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
      tab === t ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-primary"
    }`;

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-text-primary">AI下書きキュー</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateOriginal}
            disabled={origGenerating}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-gray-300 text-white text-sm font-bold rounded-lg transition-colors"
          >
            {origGenerating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> 生成中...</>
              : <><ClipboardList className="w-4 h-4" /> オリジナル生成</>}
          </button>
          <button
            onClick={handleAutoCollect}
            disabled={autoCollecting}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white text-sm font-bold rounded-lg transition-colors"
          >
            {autoCollecting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> 収集中...</>
              : <><Zap className="w-4 h-4" /> 翻訳ニュース収集</>}
          </button>
          <button onClick={refresh} disabled={loading} className="p-2 border border-border rounded-lg text-text-secondary hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Original generate result banner */}
      {origResult && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-3 text-sm ${
          origResult.generated > 0
            ? "bg-blue-50 border border-blue-200 text-blue-700"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            {origResult.generated > 0
              ? <><strong>{origResult.generated}本</strong>のオリジナル解説を公開しました{origResult.errors > 0 ? `（${origResult.errors}件エラー）` : ""}</>
              : "オリジナル記事の生成に失敗しました"}
          </span>
          {origResult.generated > 0 && (
            <button onClick={() => window.location.href = "/insurid"} className="ml-auto text-xs font-bold underline shrink-0">
              サイトで確認 →
            </button>
          )}
        </div>
      )}

      {/* Auto-collect result banner */}
      {autoCollectResult && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm ${
          autoCollectResult.processed > 0
            ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            {autoCollectResult.processed > 0
              ? <><strong>{autoCollectResult.processed}件</strong>の翻訳ニュースを収集・公開しました{autoCollectResult.errors > 0 ? `（${autoCollectResult.errors}件エラー）` : ""}</>
              : "新しい記事が見つかりませんでした（既処理済みか取得エラー）"}
          </span>
          {autoCollectResult.processed > 0 && (
            <button onClick={() => window.location.href = "/insurid"} className="ml-auto text-xs font-bold underline shrink-0">
              サイトで確認 →
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border mb-5 gap-0">
        <button onClick={() => setTab("rss")} className={tabClass("rss")}>
          <Rss className="w-4 h-4" /> RSSから取得
        </button>
        <button onClick={() => setTab("manual")} className={tabClass("manual")}>
          <Link2 className="w-4 h-4" /> URLを手動入力
        </button>
        <button onClick={() => setTab("queue")} className={tabClass("queue")}>
          <ClipboardList className="w-4 h-4" /> 承認キュー
          {drafts.length > 0 && (
            <span className="ml-1 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {drafts.length > 9 ? "9+" : drafts.length}
            </span>
          )}
        </button>
      </div>

      {/* ── RSS Tab ── */}
      {tab === "rss" && (
        <div>
          {/* 生成完了バナー */}
          {doneCount !== null && (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span><strong>{doneCount}件</strong>のドラフトを生成しました。承認キューで確認してください。</span>
              </div>
              <button
                onClick={() => setTab("queue")}
                className="text-xs font-bold text-green-700 border border-green-300 rounded-lg px-3 py-1.5 hover:bg-green-100 transition-colors shrink-0"
              >
                承認キューへ →
              </button>
            </div>
          )}

          {/* 即公開モードトグル */}
          <div className="flex items-center gap-3 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setAutoPublish((v) => !v)}
                className={`relative w-9 h-5 rounded-full transition-colors ${autoPublish ? "bg-primary" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoPublish ? "translate-x-4" : ""}`} />
              </div>
              <span className="text-sm font-medium text-amber-800">
                {autoPublish ? "⚡ 生成後すぐに公開（承認スキップ）" : "レビューしてから公開"}
              </span>
            </label>
          </div>

          {/* Source selector + fetch */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <select
              value={rssSource}
              onChange={(e) => setRssSource(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              <option value="all">すべてのソース</option>
              {rssSources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={() => fetchRss(rssSource)}
              disabled={rssLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-border rounded-lg text-sm text-text-secondary hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {rssLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              取得
            </button>
            {rssItems.length > 0 && (
              <>
                <button onClick={toggleAll} className="flex items-center gap-1 px-3 py-2 text-sm text-text-secondary hover:text-primary transition-colors">
                  {rssItems.filter((i) => !generated.has(i.url)).every((i) => selected.has(i.url)) && selected.size > 0
                    ? <CheckSquare className="w-4 h-4" />
                    : <Square className="w-4 h-4" />}
                  全選択
                </button>
                <button
                  onClick={generateFromRss}
                  disabled={selected.size === 0 || bulkLoading}
                  className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {bulkLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> 生成中 {bulkProgress?.done}/{bulkProgress?.total}件…</>
                  ) : (
                    <><Plus className="w-4 h-4" /> 選択した{selected.size}件をドラフト生成</>
                  )}
                </button>
              </>
            )}
          </div>

          {rssError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{rssError}</p>}
          {bulkErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 space-y-1">
              <p className="text-xs font-bold text-red-700">エラー詳細：</p>
              {bulkErrors.map((e, i) => <p key={i} className="text-xs text-red-600 font-mono break-all">{e}</p>)}
            </div>
          )}

          {rssLoading && (
            <div className="flex items-center justify-center py-16 text-text-muted gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> RSSフィードを取得中...
            </div>
          )}

          {!rssLoading && rssItems.length === 0 && !rssError && (
            <div className="text-center py-16 text-text-muted text-sm">「取得」を押してRSSフィードを読み込んでください</div>
          )}

          {!rssLoading && rssItems.length > 0 && (
            <div className="space-y-2">
              {rssItems.map((item) => {
                const isSelected = selected.has(item.url);
                const isDone = generated.has(item.url);
                return (
                  <div
                    key={item.url}
                    onClick={() => isDone ? setTab("queue") : toggleSelect(item.url)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      isDone
                        ? "border-green-300 bg-green-50 cursor-pointer hover:bg-green-100"
                        : isSelected
                        ? "border-primary bg-primary/5 cursor-pointer"
                        : "border-border bg-white hover:border-slate-300 cursor-pointer"
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isDone ? "border-green-500 bg-green-500" : isSelected ? "border-primary bg-primary" : "border-slate-300"
                    }`}>
                      {(isDone || isSelected) && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-text-muted bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.source}
                        </span>
                        {item.pubDate && (
                          <span className="text-[11px] text-text-muted">
                            {new Date(item.pubDate).toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" })}
                          </span>
                        )}
                        {isDone && (
                          <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                            ✓ 生成済み → 承認キューへ
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-text-primary line-clamp-1">{item.title}</p>
                      {item.excerpt && <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{item.excerpt}</p>}
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 p-1.5 text-text-muted hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Manual Tab ── */}
      {tab === "manual" && (
        <div className="bg-white border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-text-primary flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-primary" /> 元記事URLを入力してAIドラフトを生成
          </p>
          <input ref={urlRef} type="url" value={addUrl} onChange={(e) => setAddUrl(e.target.value)}
            placeholder="https://www.insurancejournal.com/..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="text" value={addTitle} onChange={(e) => setAddTitle(e.target.value)}
            placeholder="元記事タイトル（英語）（任意）"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <textarea value={addExcerpt} onChange={(e) => setAddExcerpt(e.target.value)}
            placeholder="記事の要約・概要（英語）（任意、あると精度が上がります）"
            rows={3} className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
          {addError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{addError}</p>}
          <button onClick={handleAddAndGenerate} disabled={addLoading || !addUrl.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors">
            {addLoading
              ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />AI生成中（30〜60秒）...</>
              : "ドラフト生成"}
          </button>
        </div>
      )}

      {/* ── Queue Tab ── */}
      {tab === "queue" && (
        <div>
          {drafts.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">承認待ちのドラフトはありません</p>
              <p className="text-xs mt-1">RSSまたはURLからドラフトを生成してください</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-text-muted">{drafts.length}件のドラフトが承認待ちです</p>
                <button
                  onClick={async () => {
                    if (!confirm(`${drafts.length}件すべてを公開しますか？`)) return;
                    for (const d of [...drafts]) await handleApprove(d.id, "none");
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-lg transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> 全件承認・公開
                </button>
              </div>
              <div className="space-y-3">
                {drafts.map((draft) => (
                  <QueueCard key={draft.id} draft={draft} onApprove={handleApprove} onReject={handleReject} onRegenerate={handleRegenerate} onUpdate={handleUpdate} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
