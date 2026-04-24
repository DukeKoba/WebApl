import { generateTextFull } from './claudeService.js';

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
英検2級関連の投稿は日本語で作成し、ラーメン関連の投稿は英語で作成します。
文字数制限を厳守し（X: 280文字、Instagram: 2200文字以内）、絵文字を効果的に使用します。
他のエージェントへの説明・議論は日本語で行い、最終的な投稿文のみ指定の言語で作成してください。`,
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

export async function orchestrateAgents(task, onMessage) {
  const conversation = [];
  const lang = task.type === 'ramen' ? 'en' : 'ja';

  // Round 1: Marketer strategy
  const marketerR1Prompt = buildMarketerR1Prompt(task);
  const marketerR1 = await callAgent('marketer', marketerR1Prompt, [], onMessage, 1, lang);
  conversation.push({ agent: 'marketer', round: 1, content: marketerR1 });

  // Round 1: Copywriter first draft
  const copywriterR1Prompt = buildCopywriterR1Prompt(task, marketerR1);
  const copywriterR1 = await callAgent('copywriter', copywriterR1Prompt, [], onMessage, 1, lang);
  conversation.push({ agent: 'copywriter', round: 1, content: copywriterR1 });

  // Round 1: Consultant feedback
  const consultantR1Prompt = buildConsultantR1Prompt(task, marketerR1, copywriterR1);
  const consultantR1 = await callAgent('consultant', consultantR1Prompt, [], onMessage, 1, lang);
  conversation.push({ agent: 'consultant', round: 1, content: consultantR1 });

  // Round 2: Copywriter revised
  const copywriterR2Prompt = buildCopywriterR2Prompt(task, copywriterR1, consultantR1);
  const copywriterR2 = await callAgent('copywriter', copywriterR2Prompt, [], onMessage, 2, lang);
  conversation.push({ agent: 'copywriter', round: 2, content: copywriterR2 });

  // Round 2: Consultant final review
  const consultantR2Prompt = buildConsultantR2Prompt(task, copywriterR2);
  const consultantR2 = await callAgent('consultant', consultantR2Prompt, [], onMessage, 2, lang);
  conversation.push({ agent: 'consultant', round: 2, content: consultantR2 });

  // Round 3: Copywriter final post
  const finalPrompt = buildFinalPrompt(task, copywriterR2, consultantR2);
  const finalPost = await callAgent('copywriter', finalPrompt, [], onMessage, 3, lang);
  conversation.push({ agent: 'copywriter', round: 3, content: finalPost });

  // 最終投稿文を抽出
  const extractedPost = extractFinalPostText(finalPost, task.platform);

  return { conversation, finalPost: extractedPost };
}

async function callAgent(agentRole, prompt, _history, onMessage, round, lang = 'ja') {
  const agent = AGENTS[agentRole];
  const baseSystem = agent.systemPrompt;
  // ラーメンモードでは議論も最終投稿もすべて英語に統一（読者=海外フォロワー想定）
  const systemPrompt = lang === 'en'
    ? `${baseSystem}\n\nIMPORTANT: This task is in ENGLISH mode. Respond ONLY in fluent English for every message, including analysis, feedback, drafts, and the final post. Do not use Japanese at all.`
    : baseSystem;
  const content = await generateTextFull(systemPrompt, prompt, { maxTokens: 1024 });

  // ラーメンモードではエージェント名も英語表示にする
  const displayName = lang === 'en' ? (AGENT_NAMES_EN[agentRole] || agent.name) : agent.name;

  if (onMessage) {
    onMessage({
      agent: agentRole,
      name: displayName,
      round,
      content,
    });
  }

  return content;
}

const AGENT_NAMES_EN = {
  marketer: 'Marketing Strategist',
  copywriter: 'Copywriter',
  consultant: 'Digital Marketing Consultant',
};

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
    return `We are posting a ramen experience to Instagram in ENGLISH.
Ramen analysis: ${JSON.stringify(task.imageAnalysis)}
Restaurant: ${task.restaurantName || 'unknown'}
Location: ${task.location || 'unknown'}
Visit date: ${task.visitDate || 'unknown'}
User notes: ${task.impressions || 'none'}

Please provide:
1. The ideal target audience (foodies, travelers, ramen-lovers, etc.)
2. Recommended posting time window (in the audience's local timezone)
3. Propose EXACTLY 20–30 Instagram hashtags (mostly English, with a handful of Japanese romaji) grouped by:
   - General food (#foodie #food #instafood #foodphotography #yummy ...)
   - Ramen-specific (#ramen #ramennoodles #ramenlovers #japaneseramen #noodles ...)
   - Japanese food (#japanesefood #japanfood #tokyofood ...)
   - Style (#tonkotsu #miso #shoyu #shio #tsukemen — pick only those that apply)
   - Location (${task.location ? `#${task.location.replace(/[\s,]/g, '')}` : '#tokyo'} and neighborhood tags)
   Instagram reaches farthest with 20–30 hashtags.
4. Three concrete engagement levers (hook, saves, shares).

Respond in English.`;
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
    return `Write the first draft of an Instagram caption in ENGLISH for a ramen experience.
Ramen details:
- Style: ${task.imageAnalysis?.ramen_type || 'unknown'}
- Visual notes: ${task.imageAnalysis?.english_description || ''}
- Toppings: ${(task.imageAnalysis?.toppings || []).join(', ') || 'unknown'}
- Restaurant: ${task.restaurantName || 'unknown'}
- Location: ${task.location || 'unknown'}
- Visit date: ${task.visitDate || 'unknown'}
- User notes: ${task.impressions || ''}
Marketer's analysis: ${marketerAnalysis}

Requirements:
- A mouth-watering English caption (~300 characters for the body, not counting hashtags)
- Sensory, emotional language that makes readers want to eat it NOW
- Include the hashtags the marketer proposed
- Use emojis thoughtfully

Output the first draft.`;
  }
}

function buildConsultantR1Prompt(task, marketerAnalysis, copywriterDraft) {
  if (task.type === 'ramen') {
    return `The copywriter produced a draft caption. Platform: Instagram.

Draft:
${copywriterDraft}

Marketer's analysis:
${marketerAnalysis}

Give feedback in ENGLISH on:
1. Strength of the hook (first line)
2. Character count (keep under 2200)
3. Hashtag quality (should be 20–30 for Instagram)
4. Three concrete improvements to boost engagement
5. CTA presence and suggestion`;
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
    return `Revise the caption based on the consultant's feedback.

Previous draft:
${copywriterR1}

Consultant feedback:
${consultantFeedback}

Produce the improved draft. Keep it engaging, keep 20–30 hashtags, stay under 2200 characters. Output in English.`;
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
    return `The copywriter produced an improved draft:

${copywriterR2}

Provide a final check in ENGLISH:
1. Two strengths of this post
2. At most one small tweak (skip if nothing to improve)
3. Predicted engagement rating (★1–5) with reasoning`;
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
    return `Finalize the Instagram caption.

Current draft:
${copywriterR2}

Consultant's final review:
${consultantFinalReview}

Output ONLY the final post text. Absolute rules:
- A punchy English caption (2–4 sentences)
- Naturally include the line "📲 Find more ramen on Slurp!" near the end of the caption
- One blank line
- 20–30 hashtags grouped at the end (must include #ramen #foodie #japanesefood)
- No prefaces or explanations around the post

Format:
[English caption including the Slurp line]

[20–30 hashtags]`;
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
