import { Bot, User, Calendar, RefreshCw } from "lucide-react";

interface AuthorBylineProps {
  aiModel: string;
  editorName: string;
  publishedAt: string;
  updatedAt?: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

export default function AuthorByline({ aiModel, editorName, publishedAt, updatedAt }: AuthorBylineProps) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
      <span className="flex items-center gap-1">
        <Bot className="w-3.5 h-3.5 text-indigo-400" />
        AI下書き: {aiModel}
      </span>
      <span className="flex items-center gap-1">
        <User className="w-3.5 h-3.5 text-text-muted" />
        編集: {editorName}
      </span>
      <span className="flex items-center gap-1">
        <Calendar className="w-3.5 h-3.5 text-text-muted" />
        {formatDate(publishedAt)} JST
      </span>
      {updatedAt && (
        <span className="flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
          更新: {formatDate(updatedAt)}
        </span>
      )}
    </div>
  );
}
