# OptimalRN Web App

OptimalRNの公式Webサイト・Webアプリケーション。

## 主な機能

| 機能 | URL | 説明 |
|------|-----|------|
| ランディングページ | `/` | OptimalRNのサービス紹介LP |
| 補助金申請書AI | `/subsidy-generator` | デジタル化・AI導入補助金2026の申請書ドラフトを自動生成 |
| AI経営診断 | `/consulting` | 5つのAIエージェントによる中小企業向け経営診断 |
| 経営診断ツール群 | `/wage-capacity`, `/succession-score` ほか | 中小企業白書2025対応の各種診断ツール |

## 技術スタック

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Deployment**: Vercel

## ローカル開発

```bash
npm install
npm run dev
# → http://localhost:3000
```

## ビルド

```bash
npm run build
npm run start
```

## Vercelへのデプロイ

このアプリはリポジトリの `app/` サブディレクトリにあります。
Vercelの設定で **Root Directory** を `app` に指定してください。

詳細な手順は `../VERCEL_DEPLOY.md` を参照。
