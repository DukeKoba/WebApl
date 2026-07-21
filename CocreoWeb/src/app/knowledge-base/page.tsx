"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  FileText,
  Tag,
  Calendar,
  ChevronDown,
  ChevronRight,
  BarChart3,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { KNOWLEDGE_REPORTS, KnowledgeReport, ReportSection } from "@/lib/knowledge-base";

export default function KnowledgeBasePage() {
  const [selectedReport, setSelectedReport] = useState<KnowledgeReport | null>(
    null
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  if (selectedReport) {
    return (
      <div className="min-h-screen bg-surface">
        <Header onBack={() => setSelectedReport(null)} currentPage="レポート" breadcrumb={[{ label: "レポート" }]} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Report header */}
          <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 md:p-8 text-white mb-8">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
              <BookOpen className="w-4 h-4" />
              {selectedReport.category}
            </div>
            <h1 className="text-xl md:text-2xl font-bold mb-2">
              {selectedReport.title}
            </h1>
            <p className="text-white/80 text-sm">{selectedReport.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-white/60">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {selectedReport.updatedAt}
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {selectedReport.sourceFile}
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {selectedReport.keyMetrics.map((m) => (
              <div
                key={m.label}
                className="bg-white rounded-xl border border-border p-4"
              >
                <div className="text-xs text-text-secondary mb-1">{m.label}</div>
                <div className="text-lg font-bold text-primary">{m.value}</div>
                {m.context && (
                  <div className="text-xs text-text-secondary">{m.context}</div>
                )}
              </div>
            ))}
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {selectedReport.sections.map((section) => {
              const isExpanded = expandedSections.has(section.id);
              return (
                <div
                  key={section.id}
                  className="bg-white rounded-xl border border-border overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <h2 className="font-bold">{section.title}</h2>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-text-secondary shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-text-secondary shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 animate-fade-in">
                      <div className="prose prose-sm max-w-none text-text-secondary">
                        {section.content.split("\n").map((line, i) => {
                          if (line.startsWith("**") && line.endsWith("**:")) {
                            return (
                              <h4 key={i} className="font-bold text-text-primary mt-3 mb-1 text-sm">
                                {line.replace(/\*\*/g, "")}
                              </h4>
                            );
                          }
                          if (line.startsWith("- **")) {
                            const parts = line.replace("- **", "").split("**");
                            return (
                              <div key={i} className="flex items-start gap-2 text-sm ml-2">
                                <span className="text-primary mt-1.5 shrink-0">•</span>
                                <span>
                                  <strong>{parts[0]}</strong>
                                  {parts[1]}
                                </span>
                              </div>
                            );
                          }
                          if (line.startsWith("- ")) {
                            return (
                              <div key={i} className="flex items-start gap-2 text-sm ml-2">
                                <span className="text-primary mt-1.5 shrink-0">•</span>
                                <span>{line.slice(2)}</span>
                              </div>
                            );
                          }
                          if (line.trim() === "") return <div key={i} className="h-2" />;
                          return (
                            <p key={i} className="text-sm">
                              {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                                part.startsWith("**") && part.endsWith("**") ? (
                                  <strong key={j} className="text-text-primary">
                                    {part.slice(2, -2)}
                                  </strong>
                                ) : (
                                  <span key={j}>{part}</span>
                                )
                              )}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-8 bg-primary/5 rounded-xl p-6 text-center">
            <p className="text-sm text-text-secondary mb-3">
              このレポートの知見をAIコンサルに活用できます
            </p>
            <a
              href="/consulting"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              AIコンサルで相談
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Report list
  return (
    <div className="min-h-screen bg-surface">
      <Header onBack={() => window.history.back()} currentPage="レポート" breadcrumb={[{ label: "レポート" }]} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-4">
            <BookOpen className="w-4 h-4" />
            ナレッジベース
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            事業計画・調査レポート
          </h1>
          <p className="text-text-secondary text-sm">
            AIエージェントが調査・分析した事業計画レポートを閲覧できます
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {KNOWLEDGE_REPORTS.map((report) => (
            <div
              key={report.id}
              onClick={() => {
                setSelectedReport(report);
                setExpandedSections(new Set());
              }}
              className="bg-white rounded-2xl border border-border p-6 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                  {report.category}
                </span>
                <span className="text-xs text-text-secondary">
                  {report.updatedAt}
                </span>
              </div>

              <h2 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                {report.title}
              </h2>

              <p className="text-sm text-text-secondary mb-4 line-clamp-3">
                {report.description}
              </p>

              {/* Key metrics preview */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {report.keyMetrics.slice(0, 4).map((m) => (
                  <div key={m.label} className="bg-surface rounded-lg p-2">
                    <div className="text-xs text-text-secondary truncate">
                      {m.label}
                    </div>
                    <div className="text-sm font-bold text-primary">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {report.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-gray-100 text-text-secondary rounded-full flex items-center gap-1"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
