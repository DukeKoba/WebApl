# 日本語フォントの配置

このディレクトリに **Noto Sans JP** の `.otf` / `.ttf` を置くと、
サーバー側のSVG→PNG変換（`sharp`/librsvg）で日本語が正しく描画されます。

置かない場合、`server/src/fonts.js` の起動時チェックが失敗し、
カード画像の生成API（`POST /api/agentdx/posts/:id/image/generate`）は **503** を返します。
これは「日本語が豆腐（□）になった画像が、気づかないまま X に投稿される」のを防ぐためです。

## 背景

`Hiragino Sans` は macOS 専用で、Render の Node ランタイムには日本語フォントが一切入っていません。
`fc-match` は `Noto Sans JP` も `sans-serif` も **DejaVu Sans**（CJKグリフなし）に解決するため、
日本語は全て豆腐になります。ローカルの Mac では Hiragino が効いて正常に見えるため、
**本番だけ壊れて発覚しにくい**という形になっていました。

## 取得方法

Google Fonts（SIL Open Font License 1.1）から取得します。

```sh
cd server/assets/fonts
curl -L -o NotoSansJP.ttf \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf"
```

可変フォント1本（約9.6MB）で Regular〜Bold を賄えます。
リポジトリを軽く保ちたい場合は `pyftsubset` でサブセット化してください。

```sh
pip install fonttools brotli
pyftsubset NotoSansJP.ttf \
  --unicodes="U+0020-007E,U+3000-303F,U+3040-309F,U+30A0-30FF,U+FF00-FFEF,U+4E00-9FFF" \
  --output-file=NotoSansJP-subset.ttf
```

## 確認

サーバー起動時のログに以下が出れば有効です。

```
[fonts] 日本語フォント OK（画像生成を有効化）
```

失敗している場合はこう出ます。

```
[fonts] 日本語フォントを検出できませんでした。カード画像の生成を停止します。
```
