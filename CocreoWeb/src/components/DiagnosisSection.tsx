"use client";

import { useState } from "react";
import { ClipboardCheck, ArrowRight, RotateCcw } from "lucide-react";
import {
  DIAGNOSIS_QUESTIONS,
  calculateDiagnosis,
} from "@/lib/diagnosis";
import { DiagnosisResult } from "@/types";

interface DiagnosisSectionProps {
  onStartConsulting: (agentId?: string) => void;
}

const categoryToAgent: Record<string, string> = {
  "マーケティング": "market-researcher",
  "商品開発": "product-developer",
  "DX推進": "dx-advisor",
  "人材・組織": "hr-strategist",
  "経営戦略": "strategy-consultant",
};

export default function DiagnosisSection({ onStartConsulting }: DiagnosisSectionProps) {
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<DiagnosisResult[] | null>(null);

  const handleAnswer = (questionId: string, score: number) => {
    const newAnswers = { ...answers, [questionId]: score };
    setAnswers(newAnswers);

    if (currentQ < DIAGNOSIS_QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setResults(calculateDiagnosis(newAnswers));
    }
  };

  const reset = () => {
    setStarted(false);
    setCurrentQ(0);
    setAnswers({});
    setResults(null);
  };

  const getScoreColor = (score: number, max: number) => {
    const ratio = score / max;
    if (ratio >= 0.7) return "text-primary";
    if (ratio >= 0.4) return "text-amber-500";
    return "text-red-500";
  };

  const getBarColor = (score: number, max: number) => {
    const ratio = score / max;
    if (ratio >= 0.7) return "bg-primary";
    if (ratio >= 0.4) return "bg-amber-400";
    return "bg-red-500";
  };

  if (results) {
    const weakest = results.reduce((prev, curr) =>
      curr.score / curr.maxScore < prev.score / prev.maxScore ? curr : prev
    );

    return (
      <section id="diagnosis" className="py-20 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">経営診断結果</h2>
            <p className="text-text-secondary">
              あなたの企業の現状と改善ポイント
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
            <div className="space-y-6">
              {results.map((r) => (
                <div key={r.category}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{r.category}</span>
                    <span className={`font-bold ${getScoreColor(r.score, r.maxScore)}`}>
                      {r.score} / {r.maxScore}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ${getBarColor(r.score, r.maxScore)}`}
                      style={{ width: `${(r.score / r.maxScore) * 100}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-2">
                    <div>
                      <div className="text-xs font-medium text-text-secondary mb-1">
                        現状
                      </div>
                      {r.findings.map((f) => (
                        <p key={f} className="text-sm text-text-secondary">
                          ・{f}
                        </p>
                      ))}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-primary mb-1">
                        改善提案
                      </div>
                      {r.recommendations.map((rec) => (
                        <p key={rec} className="text-sm text-text-secondary">
                          ・{rec}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary rounded-2xl p-6 text-white text-center">
            <h3 className="text-xl font-bold mb-2">
              「{weakest.category}」に最も改善の余地があります
            </h3>
            <p className="text-white/80 mb-4">
              専門AIエージェントに無料で相談して、具体的な改善策を作りましょう。
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => onStartConsulting(categoryToAgent[weakest.category])}
                className="px-6 py-3 bg-white text-primary font-bold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              >
                AIエージェントに相談する
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 border-2 border-white/30 text-white rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                やり直す
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!started) {
    return (
      <section id="diagnosis" className="py-20 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
            <ClipboardCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            無料・3分でできる経営診断
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
            10問の簡単な質問に答えるだけで、マーケティング・商品開発・DX・人材・経営戦略の
            5分野であなたの企業の現状と改善ポイントが分かります。
          </p>
          <button
            onClick={() => setStarted(true)}
            className="px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            経営診断を始める
          </button>
        </div>
      </section>
    );
  }

  const question = DIAGNOSIS_QUESTIONS[currentQ];

  return (
    <section id="diagnosis" className="py-20 bg-surface">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center text-sm text-text-secondary mb-2">
            <span>{question.category}</span>
            <span>
              {currentQ + 1} / {DIAGNOSIS_QUESTIONS.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQ + 1) / DIAGNOSIS_QUESTIONS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 animate-fade-in">
          <h3 className="text-lg font-bold mb-6">{question.question}</h3>
          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.label}
                onClick={() => handleAnswer(question.id, option.score)}
                className="w-full text-left px-5 py-4 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-sm"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
