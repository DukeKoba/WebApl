import { generateTextFull } from './claudeService.js';

const SLURP_APP_URL = 'https://apps.apple.com/app/id6761906850';

export const AGENTS = {
  marketer: {
    role: 'marketer',
    name: 'マーケティングのプロ',
    color: 'blue',
    icon: 'Target',
    systemPrompt: `あなたはソーシャルメディア戦略の専門家です。日本市場向けのX（Twitter）/Instagramマーケティングに精通しています。
ターゲット層分析、最適な投稿時間帯、効果的なハッシュタグ戦略、エンゲージメントを高める投稿の要素について具体的なアドバイスを行います。
常に日本語で回答してください。分析は簡潔で実用的にしてください。`,
  },
  copywriter: {
    role: 'copywriter',
    name: '有名コピーライター',
    color: 'purple',
    icon: 'PenTool',
    systemPrompt: `あなたはSNSバズり投稿で有名なコピーライターです。読者を引きつける魅力的な文章を作成します。
すべての投稿文は日本語で作成します（英検2級・ラーメン・AI教育など、ジャンルを問わず）。
文字数制限を厳守し（X: 280文字、Instagram: 2200文字以内）、絵文字を効果的に使用します。
常に日本語で回答してください。`,
  },
  consultant: {
    role: 'consultant',
    name: 'デジタルマーケティングコンサルタント',
    color: 'green',
    icon: 'TrendingUp',
    systemPrompt: `あなたはデジタルマーケティングのコンサルタントです。SNSアルゴリズムとエンゲージメント最適化の専門家です。
投稿のリーチ拡大、フォロワー獲得、エンゲージメント向上のための具体的な改善提案を行います。
ハッシュタグの数と選択、CTAの効果、投稿のフック（最初の一文）の重要性について指導します。
常に日本語で回答してください。`,
  },
};

export async function orchestrateAgents(task, onMessage, onStatus) {
  const conversation = [];

  // Stage 1: 全て日本語で議論・生成
  const marketerR1Prompt = buildMarketerR1Prompt(task);
  const marketerR1 = await callAgent('marketer', marketerR1Prompt, [], onMessage, 1);
  conversation.push({ agent: 'marketer', round: 1, content: marketerR1 });

  const copywriterR1Prompt = buildCopywriterR1Prompt(task, marketerR1);
  const copywriterR1 = await callAgent('copywriter', copywriterR1Prompt, [], onMessage, 1);
  conversation.push({ agent: 'copywriter', round: 1, content: copywriterR1 });

  const consultantR1Prompt = buildConsultantR1Prompt(task, marketerR1, copywriterR1);
  const consultantR1 = await callAgent('consultant', consultantR1Prompt, [], onMessage, 1);
  conversation.push({ agent: 'consultant', round: 1, content: consultantR1 });

  const copywriterR2Prompt = buildCopywriterR2Prompt(task, copywriterR1, consultantR1);
  const copywriterR2 = await callAgent('copywriter', copywriterR2Prompt, [], onMessage, 2);
  conversation.push({ agent: 'copywriter', round: 2, content: copywriterR2 });

  const consultantR2Prompt = buildConsultantR2Prompt(task, copywriterR2);
  const consultantR2 = await callAgent('consultant', consultantR2Prompt, [], onMessage, 2);
  conversation.push({ agent: 'consultant', round: 2, content: consultantR2 });

  const finalPrompt = buildFinalPrompt(task, copywriterR2, consultantR2);
  const finalPostRaw = await callAgent('copywriter', finalPrompt, [], onMessage, 3);
  conversation.push({ agent: 'copywriter', round: 3, content: finalPostRaw });

  const finalPost = extractFinalPostText(finalPostRaw, task.platform);

  return { conversation, finalPost, japaneseTranslation: null };
}

async function callAgent(agentRole, prompt, _history, onMessage, round) {
  const agent = AGENTS[agentRole];
  const content = await generateTextFull(agent.systemPrompt, prompt, { maxTokens: 1024 });

  if (onMessage) {
    onMessage({ agent: agentRole, name: agent.name, round, content });
  }

  return content;
}

function buildMarketerR1Prompt(task) {
  if (task.type === 'eiken') {
    return `英検2級の学習コンテンツをXに投稿します。
問題タイプ: ${task.questionType}

以下を分析・提案してください：
1. このコンテンツに最適なターゲット層（年齢、学習段階など）
2. 推奨する投稿時間帯（日本時間）
3. X投稿用ハッシュタグを**必ず2〜3個**提案してください（例: #英検2級 #英語学習 #英検対策）
   ※Xはハッシュタグが多すぎるとリーチが下がるため2〜3個が最適
4. エンゲージメントを高めるポイント`;
  } else if (task.type === 'aiedu') {
    return `AI教育コンテンツをXに日本語で投稿します。
コンテンツタイプ: ${task.contentType}

以下を分析・提案してください：
1. このAI教育コンテンツに最適なターゲット層（エンジニア、学生、ビジネスパーソンなど）
2. 推奨する投稿時間帯（日本時間）
3. X投稿用ハッシュタグを**必ず2〜3個**提案してください（例: #生成AI #ChatGPT #AI活用）
   ※Xはハッシュタグが多すぎるとリーチが下がるため2〜3個が最適
4. エンゲージメントを高めるポイント`;
  } else {
    const reviewBlock = task.webReviews
      ? `\n【取得済みWeb口コミ（このラーメンの実態を正確に表現する一次情報）】\n${task.webReviews}\n`
      : '\n（Web口コミ未取得。下記のユーザー入力情報のみで判断してください。架空の表現は避けること）\n';
    const previousPostsBlock = task.previousPosts?.length
      ? `\n【この店の過去投稿（今回は必ず異なる切り口・表現で投稿すること）】\n${task.previousPosts.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n`
      : '';
    return `Instagramにラーメン体験を投稿します（日本語で作成し、後で英語に翻訳します）。

【ユーザー入力】
- 店舗: ${task.restaurantName || '不明'}
- ラーメン名（メニュー）: ${task.ramenName || '不明'}
- 場所: ${task.location || '不明'}
- ラーメンの種類: ${task.ramenType || '不明'}
- 訪問日: ${task.visitDate || '不明'}
- 感想: ${task.impressions || 'なし'}
${reviewBlock}${previousPostsBlock}
以下を日本語で分析・提案してください：
1. 最適なターゲット層（ラーメン好き、食べ歩きファン、旅行者など）
2. 推奨投稿時間帯
3. Instagramハッシュタグを最大5個提案（最も関連性の高いものを厳選）：
   - #ラーメン を必ず含める
   - ${task.ramenType ? `#${task.ramenType}` : 'ラーメンの種類に合ったタグ'}
   - ${task.location ? `#${task.location.replace(/[\s,]/g, '')}` : '場所タグ'}
   - あと2個を内容・特徴から厳選（重複なし）
   ※現在はハッシュタグ5個まで
4. エンゲージメントを高める施策（フック・保存率・シェア促進）`;
  }
}

function buildCopywriterR1Prompt(task, marketerAnalysis) {
  if (task.type === 'eiken') {
    return `英検2級の投稿文の初稿を日本語で作成してください。
問題タイプ: ${task.questionType}
マーケターの分析: ${marketerAnalysis}

要件：
- X（Twitter）の280文字以内
- 英検2級の実際のサンプル問題またはTipsを含める
- 学習者が参考になる内容
- 絵文字を適度に使用
- ハッシュタグ（マーケターが提案したもの）を含める
- 架空の統計（「合格者の98%が〜」等）や偽の限定企画（「残り○時間」「正解者にプレゼント」等）を書かない
- 「いいね・RT・フォローお願いします」等のお願い文を入れない

投稿文の初稿を作成してください。`;
  } else if (task.type === 'aiedu') {
    return `AI教育コンテンツの投稿文の初稿を日本語で作成してください。
コンテンツタイプ: ${task.contentType}
マーケターの分析: ${marketerAnalysis}

要件：
- X（Twitter）の280文字以内を厳守
- 読者がすぐに試せる・学べる実用的な内容
- AIに関する最新トレンドや実用Tips・豆知識を含める
- 絵文字を効果的に使用
- ハッシュタグ（マーケターが提案したもの）を含める

投稿文の初稿を作成してください。`;
  } else {
    const reviewSection = task.webReviews
      ? `\n【Web口コミ情報（この情報を主軸に書いてください。架空の情報は使わないこと）】\n${task.webReviews}\n`
      : '\n⚠ Web口コミなし。下記の店舗情報・ラーメン種別・ユーザーの感想のみを使用してください。架空・誇張した表現は避けること。\n';
    const previousPostsSection = task.previousPosts?.length
      ? `\n【この店の過去投稿（冒頭フレーズ・構成・強調ポイントを全て変えること。同じ言い回しを一切使わない）】\n${task.previousPosts.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n`
      : '';
    return `Instagramのラーメン体験投稿文の初稿を日本語で作成してください（後で英語に翻訳します）。

【店舗・ラーメン情報】
- 店舗: ${task.restaurantName || '不明'}
- ラーメン名（メニュー）: ${task.ramenName || '不明'}
- 場所: ${task.location || '不明'}
- ラーメンの種類: ${task.ramenType || '不明'}
- 訪問日: ${task.visitDate || '不明'}
- ユーザーの感想: ${task.impressions || ''}
${reviewSection}${previousPostsSection}
マーケターの分析: ${marketerAnalysis}

要件：
- 食欲をそそる日本語キャプション（本文は約200〜300文字、ハッシュタグは除く）
- Web口コミとユーザーの感想に基づいた内容（架空の情報は入れない）
- 1行目で読者の手を止める引き（具体的な味の表現・店名・特徴）
- 読者が今すぐ食べたくなるような感覚的・感情的な表現
- マーケターが提案したハッシュタグを含める
- 絵文字を効果的に使用
- キャプション末尾付近に「📲 Slurpでもっとラーメン情報をチェック！ ${SLURP_APP_URL}」を自然に入れる

初稿を作成してください。`;
  }
}

function buildConsultantR1Prompt(task, marketerAnalysis, copywriterDraft) {
  if (task.type === 'ramen') {
    return `コピーライターが以下の初稿を作成しました。プラットフォーム: Instagram

初稿:
${copywriterDraft}

マーケターの分析:
${marketerAnalysis}

以下の観点でフィードバックを提供してください：
1. フック（最初の一文）の強さ
2. 文字数確認（Instagram: 2200文字以内）
3. ハッシュタグの適切さ（5個以内が条件）
4. エンゲージメントを上げる具体的な改善案（3点）
5. CTAの有無と改善提案`;
  }
  return `コピーライターが以下の投稿文の初稿を作成しました。
プラットフォーム: ${task.platform === 'x' ? 'X（Twitter）' : 'Instagram'}

初稿:
${copywriterDraft}

マーケターの分析:
${marketerAnalysis}

以下の観点でフィードバックを提供してください：
1. フック（最初の一文）の強さ
2. 文字数・文字制限の確認
3. ハッシュタグの適切さ
4. エンゲージメント率を上げるための具体的な改善案（3点）
5. CTAの有無と改善提案`;
}

function buildCopywriterR2Prompt(task, copywriterR1, consultantFeedback) {
  if (task.type === 'ramen') {
    const reviewSection = task.webReviews
      ? `\n【参照可能なWeb口コミ（事実に忠実に）】\n${task.webReviews}\n`
      : '';
    return `コンサルタントのフィードバックを受けて投稿文を改善してください。

前回の投稿文:
${copywriterR1}

コンサルタントのフィードバック:
${consultantFeedback}
${reviewSection}
日本語で改善版を作成してください。
- 口コミ・感想に書かれていない事実は追加しないこと
- ハッシュタグ5個以内（最も関連性の高いものを厳選）
- 本文＋ハッシュタグ合計で2200文字以内厳守
- 末尾に「📲 Slurpでもっとラーメン情報をチェック！ ${SLURP_APP_URL}」を維持`;
  }
  const charLimit = task.platform === 'x' ? 'X（Twitter）の280文字以内を厳守してください。' : 'Instagramキャプションとして魅力的にしてください。';
  return `コンサルタントのフィードバックを受けて投稿文を改善してください。

前回の投稿文:
${copywriterR1}

コンサルタントのフィードバック:
${consultantFeedback}

フィードバックを反映した改善版を作成してください。
${charLimit}`;
}

function buildConsultantR2Prompt(task, copywriterR2) {
  if (task.type === 'ramen') {
    return `コピーライターが改善版を作成しました：

${copywriterR2}

最終確認として：
1. この投稿の強みを2点挙げてください
2. 最終的な微調整提案（あれば1点のみ）
3. この投稿の予想エンゲージメント評価（★1〜5）とその理由`;
  }
  return `コピーライターが改善版を作成しました：

${copywriterR2}

最終確認として：
1. この投稿の強みを2点挙げてください
2. 最終的な微調整提案（あれば1点のみ）
3. この投稿の予想エンゲージメント評価（★1〜5）とその理由`;
}

function buildFinalPrompt(task, copywriterR2, consultantFinalReview) {
  if (task.platform === 'x') {
    return `最終確認を経て、投稿文を確定してください。

現在の投稿文:
${copywriterR2}

コンサルタントの最終レビュー:
${consultantFinalReview}

【最終投稿文】として、投稿するテキストのみを出力してください。
絶対条件：
- 280文字以内を厳守（ハッシュタグ含む）
- ハッシュタグを必ず2〜3個含める（投稿文末尾に配置）
- 前後に説明文を入れず、投稿文そのものだけを出力`;
  } else {
    return `Instagramキャプションを確定してください（日本語で生成します。後で英語に翻訳します）。

現在の投稿文:
${copywriterR2}

コンサルタントの最終レビュー:
${consultantFinalReview}

【最終投稿文】として、投稿するテキストのみを出力してください。
絶対条件：
- 食欲をそそる日本語キャプション（本文2〜4文）
- キャプション内に自然な形で「📲 Slurpでもっとラーメン情報をチェック！ ${SLURP_APP_URL}」を含める
- 1行空けてから
- ハッシュタグ5個以内をまとめて配置（#ラーメン を必ず含める）
- 前後に説明文を入れず、投稿文そのものだけを出力

形式:
[日本語キャプション（Slurpの一文を含む）]

[ハッシュタグ5個以内]`;
  }
}

function extractFinalPostText(finalAgentResponse) {
  // Remove common prefixes that agents might add
  const cleaned = finalAgentResponse
    .replace(/^【最終投稿文】\s*/m, '')
    .replace(/^最終投稿文[：:]\s*/m, '')
    .trim();
  return cleaned;
}

/* ═══════════════════════ 英検専用エージェントチーム ═══════════════════════
 * マーケター（ブリーフ策定）→ コピーライター（初稿）→ コンサルタント（品質確定）
 * の3ラウンド。過去投稿との被り防止・フックの型のローテーションを行い、
 * マーケティングプラン（docs/EIKEN_GROWTH_STRATEGY.md）に沿った投稿を生成する。
 * 出力は {post, reply} の本文のみ。固定部（カウントダウン・ハッシュタグ・CTA）は
 * 呼び出し側（routes/eiken.js）が組み立てる。
 */

// JSON文字列内の生の改行・タブをエスケープする（外部AIは改行入りの不正なJSONを返しがち）
function repairJsonControlChars(jsonLike) {
  let out = '';
  let inString = false;
  let escaped = false;
  for (const ch of jsonLike) {
    if (inString) {
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        out += ch;
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      if (ch === '\n') { out += '\\n'; continue; }
      if (ch === '\r') { continue; }
      if (ch === '\t') { out += '\\t'; continue; }
      out += ch;
      continue;
    }
    if (ch === '"') inString = true;
    out += ch;
  }
  return out;
}

// スマートクォート（“ ” ’ など。外部AIやiOSのコピーで混入する）をASCIIに正規化
function normalizeSmartQuotes(s) {
  return s.replace(/[“”„″]/g, '"').replace(/[‘’′]/g, "'");
}

// 【投稿欄】/【リプ欄】区切りテキストのパース。外部AI向けの推奨形式
// （JSONと違いエスケープ・引用符の問題が起きない）
export function parseEikenMarkedText(text) {
  const t = String(text || '').replace(/```/g, '').trim();
  const m = t.match(/【投稿(?:欄)?】\s*([\s\S]*?)\s*【リプ(?:欄|ライ)?】\s*([\s\S]*)/);
  if (!m) return null;
  const post = m[1].trim();
  const reply = m[2].trim();
  if (!post) return null;
  return { post, reply: reply || null };
}

// Extract {post, reply} JSON from an agent/external-AI response (reply is optional).
// コードフェンス・前後の説明文・文字列内の生改行・スマートクォートなど、外部AIの揺れを許容する
export function parseEikenPostJson(text) {
  const cleaned = String(text || '')
    .replace(/```(?:json)?/gi, '')
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;

  const candidates = [
    match[0],
    repairJsonControlChars(match[0]),
    repairJsonControlChars(normalizeSmartQuotes(match[0])),
  ];
  for (const candidate of candidates) {
    try {
      const obj = JSON.parse(candidate);
      if (typeof obj.post === 'string' && obj.post.trim()) {
        return {
          post: obj.post.replace(/\\n/g, '\n').trim(),
          reply: typeof obj.reply === 'string' && obj.reply.trim() ? obj.reply.replace(/\\n/g, '\n').trim() : null,
        };
      }
      return null; // JSONだが post が無い → 呼び出し側でプレーンテキスト扱い
    } catch { /* try next candidate */ }
  }

  // 最終手段: "post"/"reply" の値を正規表現で直接抜き出す（改行入り不正JSON対策）
  const q = '["“”]'; // 引用符はスマートクォートも許容
  const rx = new RegExp(`${q}post${q}\\s*:\\s*${q}([\\s\\S]*?)${q}\\s*,\\s*${q}reply${q}\\s*:\\s*(?:null|${q}([\\s\\S]*?)${q})\\s*\\}`);
  const m = cleaned.match(rx);
  if (m) {
    const unesc = (s) => s.replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
    return { post: unesc(m[1]), reply: m[2] ? unesc(m[2]) : null };
  }
  return null;
}

function eikenRecentPostsBlock(recentPosts) {
  if (!recentPosts?.length) return '（過去投稿なし）';
  return recentPosts.map((t, i) => `${i + 1}. ${t.replace(/\s+/g, ' ').slice(0, 120)}`).join('\n');
}

function buildEikenBriefPrompt(task) {
  return `X（@optimalrnai）に英検${task.levelLabel}の「${task.typeLabel}」投稿を1本出します。コンテンツブリーフを作成してください。

${task.playbook}

【今回の投稿枠】
フォーマット: ${task.formatDesc}
ターゲット: ${task.target}

【最近の投稿（題材・フックの型・言い回しを絶対に被らせないこと）】
${eikenRecentPostsBlock(task.recentPosts)}

【フックの型（最近の投稿で使われていないものを選ぶ）】
${task.hookPatterns}

【参考テーマ候補】${task.varietyHint || 'なし'}（採用してもしなくてもよい。より刺さる題材があればそちらを優先）

以下を簡潔に決めてください：
1. 今回の題材（具体的な単語・文法事項・テーマを1つに確定。最近の投稿と重複禁止）
2. フックの型と冒頭1行の案
3. ターゲットのどんな悩み・欲求に刺すか（1文）
4. ${task.format === 'quiz_reply' ? 'リプ欄で答えたくなる仕掛け' : '保存・シェアしたくなる要素'}（1文）

箇条書きで簡潔に。`;
}

function buildEikenDraftPrompt(task, brief) {
  return `マーケターのブリーフに沿って、英検${task.levelLabel}のX投稿本文を書いてください。

【ブリーフ】
${brief}

【難易度・使用語彙の厳守事項】
${task.difficulty}
上記レベルを必ず守り、それより難しい語彙・文法を使わないこと。

${task.qualityRules}

${task.formatRequirements}

【文字数制限（厳守）】
- post: ${task.bodyLimit}文字以内
- reply: ${task.replyLimit}文字以内

【重要】受験日カウントダウン・URL・ハッシュタグはシステムが自動付与するため、本文に一切含めないこと。

【出力形式】
次のJSONだけを出力（前後に説明文・コードブロック記号を付けない）：
${task.format === 'quiz_reply'
  ? '{"post": "問題ポスト本文", "reply": "解答リプライ本文"}'
  : '{"post": "投稿本文", "reply": null}'}`;
}

function buildEikenReviewPrompt(task, brief, draftRaw) {
  return `コピーライターが以下の投稿案を作成しました。品質チェックし、問題があれば修正した最終版を出力してください。

【投稿案】
${draftRaw}

【ブリーフ】
${brief}

【チェックリスト】
1. 難易度: ${task.difficulty} — レベル逸脱があれば修正
2. ${task.qualityRules.replace(/\n/g, '\n   ')}
3. フックの強さ: 冒頭1行で手が止まるか。弱ければ書き直す
4. 最近の投稿との重複: 以下と題材・言い回しが被っていれば題材を守りつつ表現を変える
${eikenRecentPostsBlock(task.recentPosts)}
5. 文字数: postは${task.bodyLimit}文字以内、replyは${task.replyLimit}文字以内。超えていれば削る
6. 英語の正確性: 例文・訳・正解が正しいか
${task.format === 'quiz_reply' ? '7. postに正解・解説が漏れていないか（正解は必ずreplyのみ）' : ''}

【出力形式】
修正を反映した最終版を、次のJSONだけで出力（前後に説明文を付けない）：
${task.format === 'quiz_reply'
  ? '{"post": "問題ポスト本文", "reply": "解答リプライ本文"}'
  : '{"post": "投稿本文", "reply": null}'}`;
}

function buildEikenShortenPrompt(task, parsed) {
  return `以下の投稿が文字数制限を超えています。内容の核を残したまま短縮してください。

post（${task.bodyLimit}文字以内に）:
${parsed.post}
${parsed.reply ? `\nreply（${task.replyLimit}文字以内に）:\n${parsed.reply}` : ''}

【出力形式】
次のJSONだけを出力：
${task.format === 'quiz_reply'
  ? '{"post": "短縮後の問題ポスト", "reply": "短縮後の解答リプライ"}'
  : '{"post": "短縮後の投稿本文", "reply": null}'}`;
}

function eikenWithinLimits(parsed, task) {
  if (!parsed) return false;
  if (parsed.post.length > task.bodyLimit) return false;
  if (task.format === 'quiz_reply' && !parsed.reply) return false;
  if (parsed.reply && parsed.reply.length > task.replyLimit) return false;
  return true;
}

export async function orchestrateEikenPost(task, onMessage) {
  const conversation = [];
  const run = async (role, prompt, round) => {
    const content = await callAgent(role, prompt, [], onMessage, round);
    conversation.push({ agent: role, name: AGENTS[role].name, round, content });
    return content;
  };

  const brief = await run('marketer', buildEikenBriefPrompt(task), 1);
  const draftRaw = await run('copywriter', buildEikenDraftPrompt(task, brief), 1);
  const finalRaw = await run('consultant', buildEikenReviewPrompt(task, brief, draftRaw), 2);

  let parsed = parseEikenPostJson(finalRaw) || parseEikenPostJson(draftRaw);
  if (!parsed) throw new Error('エージェント出力のJSONパースに失敗しました。もう一度お試しください。');

  // 文字数オーバー時はコピーライターに1回だけ短縮させ、それでもダメなら切り詰める
  if (!eikenWithinLimits(parsed, task)) {
    const shortenedRaw = await run('copywriter', buildEikenShortenPrompt(task, parsed), 3);
    const shortened = parseEikenPostJson(shortenedRaw);
    if (shortened) parsed = shortened;
    parsed.post = parsed.post.slice(0, task.bodyLimit).trimEnd();
    if (parsed.reply) parsed.reply = parsed.reply.slice(0, task.replyLimit).trimEnd();
  }

  return { conversation, post: parsed.post, reply: parsed.reply };
}
