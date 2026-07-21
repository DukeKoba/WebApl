"use client";

import { useState, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  RotateCcw,
  ExternalLink,
  Lock,
  Pencil,
  Star,
} from "lucide-react";
import CategoryBadge from "../CategoryBadge";
import RegionFlag from "../RegionFlag";
import type { Draft } from "@/lib/insurid/types";

interface Props {
  draft: Draft;
  onApprove: (id: string, paywall: "none" | "premium") => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onRegenerate: (id: string, instruction: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Draft>) => Promise<void>;
}

const IMPORTANCE_STARS = (score: number) => {
  const stars = Math.round((score / 100) * 5);
  return "★".repeat(stars) + "☆".repeat(5 - stars);
};

export default function QueueCard({ draft, onApprove, onReject, onRegenerate, onUpdate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"draft" | "source">("draft");
  const [regenInstruction, setRegenInstruction] = useState("");
  const [showRegen, setShowRegen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Editable fields
  const [title, setTitle] = useState(draft.title_jp);
  const [summary, setSummary] = useState(draft.summary_jp);
  const [body, setBody] = useState(draft.body_jp);

  const importanceScore = draft.candidate?.importance_score ?? 0;
  const sourceUrl = draft.candidate?.url;

  const handleApprove = useCallback(
    async (paywall: "none" | "premium") => {
      setLoading("approve");
      if (editing) {
        await onUpdate(draft.id, { title_jp: title, summary_jp: summary, body_jp: body });
      }
      await onApprove(draft.id, paywall);
      setLoading(null);
    },
    [draft.id, editing, title, summary, body, onApprove, onUpdate]
  );

  const handleReject = useCallback(async () => {
    setLoading("reject");
    await onReject(draft.id);
    setLoading(null);
  }, [draft.id, onReject]);

  const handleRegen = useCallback(async () => {
    setLoading("regen");
    await onRegenerate(draft.id, regenInstruction);
    setRegenInstruction("");
    setShowRegen(false);
    setLoading(null);
  }, [draft.id, regenInstruction, onRegenerate]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {importanceScore > 0 && (
              <span className="text-[11px] font-bold text-amber-600 tabular-nums">
                {IMPORTANCE_STARS(importanceScore)} {importanceScore}
              </span>
            )}
            <CategoryBadge category={draft.category} size="sm" />
            <RegionFlag region={draft.region} showLabel={false} />
            {draft.state === "edited" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                編集済
              </span>
            )}
          </div>
          <p className="font-serif-jp font-bold text-text-primary text-sm leading-snug line-clamp-2">
            {title}
          </p>
          <p className="text-xs text-text-muted mt-1 line-clamp-1">{summary}</p>
        </div>
        <div className="shrink-0 mt-1">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === "draft"
                  ? "border-b-2 border-primary text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
              onClick={() => setActiveTab("draft")}
            >
              一次原稿（AI生成）
            </button>
            <button
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === "source"
                  ? "border-b-2 border-primary text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
              onClick={() => setActiveTab("source")}
            >
              原典
            </button>
          </div>

          {activeTab === "draft" ? (
            <div className="p-4 space-y-3">
              {editing ? (
                <>
                  <div>
                    <label className="block text-[11px] font-medium text-text-muted mb-1">タイトル</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-text-muted mb-1">リード</label>
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-text-muted mb-1">本文（Markdown）</label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={14}
                      className="w-full px-3 py-2 border border-border rounded-lg text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-medium text-text-muted mb-1">リード</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{summary}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-text-muted mb-1">本文プレビュー</p>
                    <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap bg-surface-soft rounded-lg p-3 max-h-60 overflow-y-auto">
                      {body}
                    </pre>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {draft.tags?.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-surface-soft border border-border text-text-muted">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {sourceUrl ? (
                <>
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {sourceUrl}
                  </a>
                  {draft.candidate?.title_original && (
                    <p className="text-xs text-text-secondary">
                      <span className="font-medium text-text-muted">元タイトル: </span>
                      {draft.candidate.title_original}
                    </p>
                  )}
                  {draft.candidate?.excerpt_original && (
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {draft.candidate.excerpt_original}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-text-muted">原典情報なし</p>
              )}
            </div>
          )}

          {/* AI Regenerate */}
          {showRegen && (
            <div className="px-4 pb-3 space-y-2">
              <input
                type="text"
                value={regenInstruction}
                onChange={(e) => setRegenInstruction(e.target.value)}
                placeholder="編集指示（例：もっと数値を強調、日本の示唆を3行に）"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleRegen}
                  disabled={loading === "regen"}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  {loading === "regen" ? "再生成中..." : "再生成実行"}
                </button>
                <button
                  onClick={() => setShowRegen(false)}
                  className="px-3 py-1.5 border border-border text-xs text-text-secondary rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setEditing((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${
                editing
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-border text-text-secondary hover:bg-gray-50"
              }`}
            >
              <Pencil className="w-3 h-3" />
              {editing ? "編集中" : "編集"}
            </button>

            <button
              onClick={() => setShowRegen((v) => !v)}
              disabled={loading !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              AI再生成
            </button>

            <div className="flex-1" />

            <button
              onClick={handleReject}
              disabled={loading !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <X className="w-3 h-3" />
              ボツ
            </button>

            <button
              onClick={() => handleApprove("premium")}
              disabled={loading !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 text-amber-700 bg-amber-50 text-xs font-medium rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              <Lock className="w-3 h-3" />
              Premium採用
            </button>

            <button
              onClick={() => handleApprove("none")}
              disabled={loading !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white text-xs font-bold rounded-lg transition-colors"
            >
              {loading === "approve" ? (
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              採用・公開
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
