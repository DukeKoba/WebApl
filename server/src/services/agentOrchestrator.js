import { generateTextFull, translateInstagramPostToEnglish } from './claudeService.js';

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

  const japanesePost = extractFinalPostText(finalPostRaw, task.platform);

  // Stage 2: ラーメン投稿は日本語原文を英語に翻訳（Instagram英語投稿用）
  let finalPost = japanesePost;
  let japaneseTranslation = null;
  if (task.type === 'ramen' && japanesePost) {
    if (onStatus) onStatus('英語に翻訳中...');
    const englishPost = await translateInstagramPostToEnglish(japanesePost);
    if (englishPost) {
      finalPost = englishPost;
      japaneseTranslation = japanesePost;
    }
  }

  return { conversation, finalPost, japaneseTranslation };
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
    return `Instagramにラーメン体験を投稿します（日本語で作成し、後で英語に翻訳します）。
ラーメン分析: ${JSON.stringify(task.imageAnalysis)}
店舗: ${task.restaurantName || '不明'}
場所: ${task.location || '不明'}
訪問日: ${task.visitDate || '不明'}
ユーザーの感想: ${task.impressions || 'なし'}

以下を日本語で分析・提案してください：
1. 最適なターゲット層（ラーメン好き、食べ歩きファン、旅行者など）
2. 推奨投稿時間帯
3. Instagramハッシュタグを20〜30個提案（日本語・英語混在）：
   - 一般フード系 (#foodie #food #instafood #グルメ #食べスタグラム ...)
   - ラーメン系 (#ラーメン #ramen #らーめん #拉麺 #ラーメン部 ...)
   - 日本食系 (#日本食 #japanesefood #japanfood ...)
   - スタイル系 (#豚骨 #醤油 #味噌 #塩 #つけ麺 — 該当するもののみ)
   - 場所系 (${task.location ? `#${task.location.replace(/[\s,]/g, '')}` : '#tokyo'} など)
   ※Instagramは20〜30個が最もリーチしやすい
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
      ? `\nWeb口コミ情報（この情報をもとに書いてください。架空の情報は使わないこと）:\n${task.webReviews}\n`
      : '\n⚠ Web口コミなし。画像分析とユーザーの感想のみを使用してください。架空・誇張した表現は避けること。\n';
    return `Instagramのラーメン体験投稿文の初稿を日本語で作成してください。
ラーメン情報:
- スタイル: ${task.imageAnalysis?.ramen_type || '不明'}
- 見た目: ${task.imageAnalysis?.japanese_description || task.imageAnalysis?.appearance || ''}
- トッピング: ${(task.imageAnalysis?.toppings || []).join('、') || '不明'}
- 店舗: ${task.restaurantName || '不明'}
- 場所: ${task.location || '不明'}
- 訪問日: ${task.visitDate || '不明'}
- ユーザーの感想: ${task.impressions || ''}
${reviewSection}
マーケターの分析: ${marketerAnalysis}

要件：
- 食欲をそそる日本語キャプション（本文は約200〜300文字、ハッシュタグは除く）
- Web口コミやユーザーの感想に基づいた内容（架空の情報は入れない）
- 読者が今すぐ食べたくなるような感覚的・感情的な表現
- マーケターが提案したハッシュタグを含める
- 絵文字を効果的に使用
- キャプション末尾付近に「📲 Slurpでもっとラーメン情報をチェック！」を自然に入れる

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
3. ハッシュタグの適切さ（20〜30個が最適）
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
    return `コンサルタントのフィードバックを受けて投稿文を改善してください。

前回の投稿文:
${copywriterR1}

コンサルタントのフィードバック:
${consultantFeedback}

日本語で改善版を作成してください。ハッシュタグ20〜30個、2200文字以内を厳守。`;
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
- キャプション内に自然な形で「📲 Slurpでもっとラーメン情報をチェック！」を含める
- 1行空けてから
- ハッシュタグ20〜30個をまとめて配置（#ラーメン #foodie #japanesefood を必ず含める）
- 前後に説明文を入れず、投稿文そのものだけを出力

形式:
[日本語キャプション（Slurpの一文を含む）]

[ハッシュタグ20〜30個]`;
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
