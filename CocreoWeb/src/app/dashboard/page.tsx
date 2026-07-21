"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Header from "@/components/Header";

interface Task {
  id: string;
  title: string;
  category: string;
  status: "completed" | "in_progress" | "pending";
  priority: "high" | "medium" | "low";
}

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Googleビジネスプロフィールの最適化",
    category: "マーケティング",
    status: "completed",
    priority: "high",
  },
  {
    id: "2",
    title: "LINE公式アカウント開設",
    category: "マーケティング",
    status: "in_progress",
    priority: "high",
  },
  {
    id: "3",
    title: "クラウド会計ソフト導入検討",
    category: "DX推進",
    status: "in_progress",
    priority: "medium",
  },
  {
    id: "4",
    title: "採用ブランディング戦略策定",
    category: "人材・組織",
    status: "pending",
    priority: "medium",
  },
  {
    id: "5",
    title: "3年間の事業計画書作成",
    category: "経営戦略",
    status: "pending",
    priority: "high",
  },
  {
    id: "6",
    title: "地域特産品を活かした新商品企画",
    category: "商品開発",
    status: "pending",
    priority: "low",
  },
];

const statusIcon = {
  completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  in_progress: <Clock className="w-4 h-4 text-blue-500" />,
  pending: <AlertTriangle className="w-4 h-4 text-amber-500" />,
};

const statusLabel = {
  completed: "完了",
  in_progress: "進行中",
  pending: "未着手",
};

export default function DashboardPage() {
  const [tasks] = useState<Task[]>(mockTasks);

  const stats = [
    {
      label: "相談回数",
      value: "12",
      icon: MessageSquare,
      change: "+3 今週",
      color: "text-blue-500",
    },
    {
      label: "改善タスク",
      value: `${tasks.filter((t) => t.status === "completed").length}/${tasks.length}`,
      icon: CheckCircle2,
      change: "進捗中",
      color: "text-green-500",
    },
    {
      label: "経営スコア",
      value: "62",
      icon: BarChart3,
      change: "+8 先月比",
      color: "text-purple-500",
    },
    {
      label: "活用エージェント",
      value: "3",
      icon: Bot,
      change: "5種類中",
      color: "text-amber-500",
    },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Header
        currentPage="ダッシュボード"
        breadcrumb={[{ label: "経営ダッシュボード" }]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">経営ダッシュボード</h1>
          <p className="text-text-secondary">
            株式会社サンプル商店 様の経営改善状況
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, change, color }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-5 border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-text-secondary">{label}</span>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="text-2xl font-bold mb-1">{value}</div>
              <div className="text-xs text-text-secondary">{change}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">改善タスク</h2>
              <span className="text-sm text-text-secondary">
                {tasks.filter((t) => t.status === "completed").length} / {tasks.length} 完了
              </span>
            </div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors"
                >
                  {statusIcon[task.status]}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {task.title}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {task.category}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      task.status === "completed"
                        ? "bg-green-50 text-green-600"
                        : task.status === "in_progress"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {statusLabel[task.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-primary to-primary-light rounded-2xl p-6 text-white">
              <TrendingUp className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg mb-2">次のアクション</h3>
              <p className="text-sm text-white/80 mb-4">
                LINE公式アカウントの設定が完了間近です。次のステップに進みましょう。
              </p>
              <button className="flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-lg font-medium text-sm hover:shadow-lg transition-all">
                続きを相談する
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <a
              href="/ai-menu"
              className="block bg-white rounded-2xl border border-border p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold">AIコンサルメニュー</h3>
              </div>
              <p className="text-xs text-text-secondary mb-3">
                大手コンサル比較で約90%コスト削減。10種のAIメニューを確認
              </p>
              <span className="flex items-center gap-1 text-xs text-primary font-medium group-hover:gap-2 transition-all">
                メニューを見る <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </a>

            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-bold">活用可能な支援制度</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: "IT導入補助金", deadline: "2026年6月末" },
                  { name: "小規模事業者持続化補助金", deadline: "2026年5月末" },
                  { name: "ものづくり補助金", deadline: "2026年7月末" },
                ].map((grant) => (
                  <div
                    key={grant.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{grant.name}</span>
                    <span className="text-xs text-text-secondary">
                      〆{grant.deadline}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
