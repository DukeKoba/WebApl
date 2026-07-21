import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

// APIキー未設定でもサーバーを起動できるよう、クライアントは初回利用時に生成する。
// キーの有無は claudeFallback.hasClaudeKey() が判定し、未設定時はプロンプト方式に切り替わる。
let clientInstance = null;
function getClient() {
  if (!clientInstance) {
    clientInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
    });
  }
  return clientInstance;
}

// 旧 claude-sonnet-4-20250514 は2026年6月に廃止予定のため claude-sonnet-5 に移行。
// Sonnet 5 は thinking がデフォルトONになるため、従来挙動を保つ箇所では明示的に無効化する。
const DEFAULT_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5';

export async function searchAiNews(contentType, label) {
  // Recency window: today, last 30 days, current year (computed at call time)
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const recent = `${y}年${m}月`;          // e.g. "2026年4月"
  const prevM = m === 1 ? `${y - 1}年12月` : `${y}年${m - 1}月`;
  const recencyTag = `${recent} OR ${prevM} 直近 最新`;

  const queries = {
    subsidy_news:   `AI IT導入補助金 ものづくり補助金 中小企業 ${recencyTag} 公募 締切 採択`,
    subsidy_howto:  `補助金 申請 採択率 事業計画書 書き方 中小企業 ${recencyTag}`,
    ai_dx:          `中小企業 AI業務改善 DX 事例 効果 ${recencyTag}`,
    ai_smb:         `中小企業 生成AI 導入事例 ROI 効果 ${recencyTag}`,
    ai_efficiency:  `生成AI 業務効率化 バックオフィス 自動化 事例 ${recencyTag}`,
    ai_tools:       `AIツール 業務活用 中小企業 新機能 リリース ${recencyTag}`,
    claude_biz:     `Claude Anthropic 業務活用 新機能 アップデート ${recencyTag}`,
    chatgpt_biz:    `ChatGPT OpenAI 業務活用 新機能 GPTs アップデート ${recencyTag}`,
    insurance_ai:   `保険代理店 AI 意向把握 コンプライアンス DX 事例 ${recencyTag}`,
    mvp:            `AI MVP 開発 内製化 Claude Code Cursor 事例 ${recencyTag}`,
    vibecoding:     `バイブコーディング Vibe Coding AI開発 ${recencyTag}`,
    cocreo_voice:   `中小企業 AI 業務改善 補助金 経営 トレンド ${recencyTag}`,
  };
  const query = queries[contentType] || `${label} 中小企業 AI 補助金 ${recencyTag}`;

  // Compute "no older than" boundary: 90 days ago
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
  const todayStr = `${y}-${String(m).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  try {
    const response = await getClient().messages.create({
      model: DEFAULT_MODEL,
      thinking: { type: 'disabled' },
      max_tokens: 2500,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }],
      messages: [{
        role: 'user',
        content: `今日は ${todayStr} です。「${query}」で最新ニュース・公募情報・事例をWeb検索してください。

【厳守ルール】
- 公開日が ${cutoffStr} 以降（直近90日以内）の記事のみ採用すること。それより古い記事は採用せず、必要なら検索キーワードを変えて再検索すること（最大5回まで検索可）。
- 1回目の検索結果が古ければ、「${recent}」「直近」「最新」「today」などの語を加えて再検索すること。
- 各記事の公開日（YYYY-MM-DD）を必ず本文に明記すること。日付不明な記事は採用しないこと。

【出力形式】
X（Twitter）投稿のネタになりそうなトピックを3〜5件、箇条書きで日本語にまとめてください。各項目に以下を含めてください：
- 公開日（YYYY-MM-DD）
- 具体的な数字・金額・締切・ツール名・企業名・補助金名
- 出典URL

最後に、最もバズりそうなトピックの出典URLを1件「SOURCE_URL: https://...」の形式で必ず記載してください。
直近90日の記事が見つからない場合は「情報なし」とだけ返してください。`,
      }],
    });

    // Aggregate text + collect citations.
    // Prefer URLs the model actually cited (text-block citations) over raw search hits,
    // because the model has filtered for recency per the prompt rules above.
    let text = '';
    const cited = [];
    const citedSeen = new Set();
    const fallback = [];
    const fallbackSeen = new Set();

    for (const block of response.content || []) {
      if (block.type === 'text') {
        text += (text ? '\n' : '') + (block.text || '');
        for (const c of block.citations || []) {
          const url = c.url;
          if (!url || citedSeen.has(url)) continue;
          citedSeen.add(url);
          cited.push({ url, title: c.title || '' });
        }
      } else if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
        for (const item of block.content) {
          const url = item.url;
          if (!url || fallbackSeen.has(url)) continue;
          fallbackSeen.add(url);
          fallback.push({ url, title: item.title || '' });
        }
      }
    }

    if (!text || text.includes('情報なし')) return { summary: null, sourceUrl: null, sources: [] };

    // Extract a single best source URL (for character-limited X post embedding)
    const urlMatch = text.match(/SOURCE_URL:\s*(https?:\/\/\S+)/);
    const sourceUrl = urlMatch ? urlMatch[1] : (cited[0]?.url || fallback[0]?.url || null);
    const summary = text.replace(/SOURCE_URL:\s*https?:\/\/\S+/g, '').trim();
    const sources = (cited.length ? cited : fallback).slice(0, 5);
    return { summary, sourceUrl, sources };
  } catch {
    return { summary: null, sourceUrl: null, sources: [] };
  }
}

// 投稿の「型」: フック → 事実 → 現場への翻訳 → ハッシュタグ。
// Xの文字数は加重計算（全角=2単位・URL=23単位・上限280単位）のため、本文は全角135字以内に収める。
const POST_FORMAT_RULES = `【投稿の型】（この構造・順序を厳守）
- 1行目: 数字か意外性のあるフック（例:「火災保険、また値上げです。今度は平均◯%」）
- 2〜3行目: 事実の要約。出典に書かれていることだけを書く。推測で数字や制度名を補わない
- 次の行: 「▼代理店の現場では」に続けて、実務への影響・やるべきことを1つだけ
- 末尾: ハッシュタグ1〜2個（#保険代理店 を基本に）

【文字数・体裁】
- 本文はURL・ハッシュタグ込みで全角135文字以内（Xでは全角1字=2単位、上限280単位。URLは長さに関わらず23単位）
- 絵文字は0〜1個まで
- 最後の行に出典を「SOURCE_URL: https://...」形式で記載（出典が実在する場合のみ）`;

export async function generateAgentDxPost(contentType, label, extraContext, systemPrompt, { sourceUrl = null, sourceText = null, ctaUrl = null, trendAngle = null } = {}) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const todayStr = `${y}-${String(m).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const recentTag = `${y}年${m}月 OR ${y}年${m === 1 ? 12 : m - 1}月 最新`;
  const trendLine = trendAngle ? `\n【今の時流（この空気感を1文でも織り込む）】\n${trendAngle}\n` : '';

  const queries = {
    ins_news:      `保険業界 ニュース 経営 提携 新戦略 ${recentTag}`,
    law_reform:    `保険業法 改正 金融庁 監督指針 規制変更 ${recentTag}`,
    new_products:  `保険 新商品 発売 改定 生命保険 損害保険 ${recentTag}`,
    market_data:   `保険市場 統計データ 加入率 保険料収入 ${recentTag}`,
    disaster_risk: `自然災害 台風 地震 保険金支払い サイバーリスク ${recentTag}`,
    agency_ops:    `保険代理店 手数料 乗合 登録要件 経営 ${recentTag}`,
    consumer_trend:`保険 消費者 加入動向 意識調査 ニーズ ${recentTag}`,
    global_ins:    `海外保険業界 InsurTech グローバル 規制 ${recentTag}`,
    trend_watch:   `site:fsa.go.jp 保険代理店 業務品質 情報管理 AI ${recentTag}`,
  };

  const isConversionType = ['efficiency_tips', 'app_demo', 'law_check', 'case_story', 'pinned_app'].includes(contentType);

  let userMessage;
  let tools;

  if (isConversionType) {
    // 転換系（受注につなげる投稿）: Web検索不要。業務知識ベースで生成し、CTAリンクを組み込む
    tools = undefined;
    userMessage = `今日は ${todayStr} です。

【テーマ】${label}
【背景・素材】${extraContext}
${trendLine}${sourceText ? `\n【追加の素材・メモ（これを最優先の材料にする）】\n${sourceText}\n` : ''}
保険代理店向けの実務に役立つX（Twitter）投稿を1件作成してください。
ニュースの紹介ではなく、「読んだ代理店がそのまま実行できる具体的な内容」にしてください。

【投稿の型】（この構造・順序を厳守）
- 1行目: 業務の痛みの提示（例:「申込書の転記、1件12分かかっていませんか」）
- 中盤: 解決策・手順・チェック観点を具体的に（数字を入れる）
- 末尾近く: 行動を促す一言${ctaUrl ? '＋リンク' : ''}
- 末尾: ハッシュタグ1〜2個（#保険代理店 を基本に）

【文字数・体裁】
- 本文はURL・ハッシュタグ込みで全角130文字以内（全角1字=2単位、上限280単位。URLは23単位）
- 絵文字は0〜1個まで
${ctaUrl ? `- 本文中のリンクには必ずこのURLを使う: ${ctaUrl}` : '- リンクは入れない'}

【出力形式】
投稿文のみを出力してください。前後に説明文を入れないでください。SOURCE_URL行は不要です。`;
  } else if (sourceUrl) {
    // 出典URL指定モード: 貼られた記事だけを根拠に生成（誤報防止の本命モード）
    tools = [{ type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 3 }];
    userMessage = `今日は ${todayStr} です。

【テーマ】${label}
【背景】${extraContext}

以下の記事URLの内容を web_fetch で取得し、その記事「だけ」を根拠にX（Twitter）投稿を1件作成してください。
記事URL: ${sourceUrl}
${sourceText ? `\n【運営者のメモ・補足（内容の解釈に使ってよい）】\n${sourceText}\n` : ''}
【厳守】
- 記事に書かれていない事実・数字・制度名を書かない
- 記事が取得できない、または保険代理店に関係が薄い場合は「NO_POST: 理由」とだけ出力する

${POST_FORMAT_RULES}
- SOURCE_URL行には必ず ${sourceUrl} を記載する

【出力形式】
投稿文とSOURCE_URLのみ出力してください。前後に説明文を入れないでください。`;
  } else if (sourceText) {
    // テキスト貼り付けモード: 貼られた本文だけを根拠に生成（ツール不要）
    tools = undefined;
    userMessage = `今日は ${todayStr} です。

【テーマ】${label}
【背景】${extraContext}

以下に貼り付けた記事・情報「だけ」を根拠に、保険代理店向けのX（Twitter）投稿を1件作成してください。

【貼り付けられた記事・情報】
${sourceText}

【厳守】
- 貼り付けられた内容に書かれていない事実・数字・制度名を書かない
- 内容が保険代理店に関係が薄い場合は「NO_POST: 理由」とだけ出力する

${POST_FORMAT_RULES}
- 貼り付け内容に出典URLが含まれていればSOURCE_URL行に記載、なければSOURCE_URL行は省略する

【出力形式】
投稿文とSOURCE_URL（あれば）のみ出力してください。前後に説明文を入れないでください。`;
  } else {
    // Web検索モード: 出典なしでは書かせない（検索結果に忠実に）
    const query = queries[contentType] || `保険代理店 ${label} 最新 ${recentTag}`;
    tools = [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }];
    userMessage = `今日は ${todayStr} です。

【テーマ】${label}
【背景】${extraContext}

以下の手順でX（Twitter）投稿を1件作成してください：

1. 「${query}」でWebを検索し、直近3ヶ月以内の最新ニュース・情報を探す
2. 最もインパクトが大きく代理店担当者が知るべき記事を1件選ぶ
3. その記事に書かれている事実「だけ」を使って投稿を執筆する

【厳守】
- 検索結果に書かれていない事実・数字・制度名を書かない（記憶からの補完は禁止）
- 直近3ヶ月以内の記事が見つからない場合は「NO_POST: 直近の記事が見つかりません」とだけ出力する

${POST_FORMAT_RULES}
- SOURCE_URL行には実際に参照した記事のURLを記載する

【出力形式】
投稿文とSOURCE_URLのみ出力してください。前後に説明文を入れないでください。`;
  }

  let messages = [{ role: 'user', content: userMessage }];
  let response;
  // サーバーサイドツールの反復上限で pause_turn が返ることがあるため、最大3回まで継続する
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await getClient().messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      system: systemPrompt,
      ...(tools ? { tools } : {}),
      messages,
    });
    if (response.stop_reason !== 'pause_turn') break;
    messages = [...messages, { role: 'assistant', content: response.content }];
  }

  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
  if (!text) throw new Error('Claude からテキスト応答が返りませんでした');

  const noPostMatch = text.match(/NO_POST:\s*(.*)/);
  if (noPostMatch) {
    throw new Error(`投稿を生成できませんでした: ${noPostMatch[1] || '根拠となる記事が見つかりません'}`);
  }

  const urlMatch = text.match(/SOURCE_URL:\s*(https?:\/\/\S+)/);
  const extractedSourceUrl = urlMatch ? urlMatch[1] : (sourceUrl || null);
  const postText = text.replace(/SOURCE_URL:\s*https?:\/\/\S+/g, '').trim();
  return { postText, sourceUrl: extractedSourceUrl };
}

export async function searchRamenTypeReviews(ramenType, location) {
  if (!ramenType) return null;
  try {
    const locationPart = location ? ` ${location}` : '';
    const query = `${ramenType}ラーメン${locationPart} 口コミ 特徴 おすすめ`;
    const response = await getClient().messages.create({
      model: DEFAULT_MODEL,
      thinking: { type: 'disabled' },
      max_tokens: 2048,
      tools: [{ type: 'web_search_20260209', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `「${query}」について食べログ・Googleマップ・Rettyなどで口コミを検索してください。以下を日本語でまとめてください：
・このラーメンスタイル（${ramenType}）の特徴・味わい
・スープの特徴（具体的に）
・麺の種類・食感
・人気のトッピング・食べ方
・実際の口コミコメント（具体的な表現を引用）
実際に見つかった情報のみ使用してください。情報が見つからない場合は「口コミ情報なし」と返してください。`,
      }],
    });
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    return text && !text.includes('口コミ情報なし') ? text : null;
  } catch {
    return null;
  }
}

export async function convertImpressionToEnglish(japaneseText) {
  try {
    return await generateTextFull(
      'You are a food writer specializing in Japanese ramen. Convert the user\'s impression into vivid, engaging English suitable for an Instagram caption. Keep it natural and enthusiastic, 1-3 sentences. Output only the English text, no explanation.',
      `以下の感想を、Instagramキャプション向けの自然な英語に変換してください：\n\n${japaneseText}`,
      { maxTokens: 300 }
    );
  } catch {
    return null;
  }
}

const INSTAGRAM_CAPTION_LIMIT = 2200;

export async function translateInstagramPostToEnglish(japanesePost) {
  try {
    let english = await generateTextFull(
      `You are a creative food writer specializing in Japanese ramen culture, crafting captions for an international Instagram audience. Your goal is a vivid food story — not a literal translation, but an authentic experience.

Rules:
1. STORYTELLING: Write as if sharing a personal food discovery. Use sensory language (aroma, texture, depth of flavor). Make readers feel they must visit.
2. RAMEN TERMS: Naturally explain Japanese terms inline (e.g., "shoyu — a clear, soy-seasoned broth", "chashu — melt-in-your-mouth braised pork", "tsukemen — thick noodles served for dipping").
3. HASHTAGS: Replace ALL Japanese hashtags with English equivalents that international users actually search. Use: #ramen #ramennoodles #japanesefood #foodie #tokyofood (adjust location/type to English). Never keep Japanese-script hashtags.
4. SLURP LINE: The line starting with "📲 Slurp" must become: "📲 Discover more ramen spots on Slurp! [keep the original URL]"
5. LENGTH: Total output (body + blank line + hashtags) MUST be 2200 characters or fewer — Instagram's hard limit. Condense if needed.
6. OUTPUT: Caption body + one blank line + hashtags only. No explanation, no preamble.`,
      `Craft an English Instagram caption from this Japanese ramen post. Follow all rules in the system prompt exactly.

[Japanese post]
${japanesePost}`,
      { maxTokens: 1500 }
    );

    if (!english) return null;
    english = english.trim();

    // Safety net: if the model still went over, retry once asking it to compress.
    if (english.length > INSTAGRAM_CAPTION_LIMIT) {
      const retry = await generateTextFull(
        'You compress Instagram captions to fit Instagram\'s 2200-character limit while preserving voice and hashtags. Output only the compressed caption.',
        `次の英語Instagramキャプションは${english.length}文字あり、Instagram上限の2200文字を超えています。意味・トーン・主要なハッシュタグを保ったまま、必ず2200文字以下に収めてください。本文を圧縮し、優先度の低いハッシュタグを削ってください。出力は圧縮後のキャプションのみ：\n\n${english}`,
        { maxTokens: 1500 }
      );
      if (retry && retry.trim().length <= INSTAGRAM_CAPTION_LIMIT) {
        english = retry.trim();
      }
    }

    return english;
  } catch {
    return null;
  }
}

export async function searchRestaurantReviews(restaurantName, location, ramenType, ramenName) {
  if (!restaurantName) return null;
  try {
    const parts = [restaurantName];
    if (ramenName) parts.push(ramenName);
    if (location) parts.push(location);
    if (ramenType) parts.push(ramenType);
    parts.push('ラーメン');
    const query = parts.join(' ');
    const focusNote = ramenName
      ? `特に「${ramenName}」というメニューに関する口コミ・評価を重点的に調べてください。`
      : ramenType ? `特に「${ramenType}」スタイルのラーメンに関する記述を優先して拾ってください。` : '';
    const response = await getClient().messages.create({
      model: DEFAULT_MODEL,
      thinking: { type: 'disabled' },
      max_tokens: 2048,
      tools: [{ type: 'web_search_20260209', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `「${query}」について食べログ・Googleマップ・Rettyなどで口コミを検索してください。${focusNote}以下を日本語でまとめてください：
・スープの特徴・味わい（具体的に）
・麺の種類・食感
・人気メニュー・おすすめ
・トッピングの特徴
・雰囲気・価格帯
・実際の口コミコメント（具体的な表現を引用）
実際に見つかった情報のみ使用してください。情報が見つからない場合は「口コミ情報なし」と返してください。`,
      }],
    });
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    return text && !text.includes('口コミ情報なし') ? text : null;
  } catch {
    return null;
  }
}


export async function generateText(systemPrompt, userMessage, options = {}) {
  const stream = await getClient().messages.stream({
    model: DEFAULT_MODEL,
      thinking: { type: 'disabled' },
    max_tokens: options.maxTokens || 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });
  return stream;
}

export async function generateTextFull(systemPrompt, userMessage, options = {}) {
  const response = await getClient().messages.create({
    model: DEFAULT_MODEL,
      thinking: { type: 'disabled' },
    max_tokens: options.maxTokens || 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });
  return response.content[0].text;
}

export async function analyzeRamenImage(imagePath) {
  const imageData = fs.readFileSync(imagePath);
  const base64 = imageData.toString('base64');
  const ext = imagePath.split('.').pop().toLowerCase();
  const mimeTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
  const mimeType = mimeTypes[ext] || 'image/jpeg';

  const response = await getClient().messages.create({
    model: DEFAULT_MODEL,
      thinking: { type: 'disabled' },
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: base64 },
        },
        {
          type: 'text',
          text: `この写真のラーメンを詳しく分析してください。以下の形式のJSONのみを返してください（説明文なし）：
{
  "ramen_type": "ラーメンのスタイル（醤油/味噌/豚骨/塩/つけ麺/その他）",
  "toppings": ["トッピング1", "トッピング2"],
  "appearance": "見た目の特徴（スープの色、麺の太さ、盛り付けなど）",
  "atmosphere": "雰囲気（カジュアル/高級/地元の名店/トレンド系）",
  "notable_features": "特筆すべき点",
  "japanese_description": "Instagramキャプション向けの魅力的な日本語説明文（1〜2文）",
  "detected_restaurant_name": "写真内の看板・メニュー・箸袋・丼・レシートなどに店名が明確に見える場合はラテン文字表記（日本語の場合はローマ字化）で返す。見えない場合は空文字列。"
}`,
        },
      ],
    }],
  });

  const text = response.content[0].text.trim();
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { english_description: text };
  } catch {
    return { english_description: text };
  }
}
