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

  // Round 1: マーケターが戦略分析
  const marketerR1Prompt = buildMarketerR1Prompt(task);
  const marketerR1 = await callAgent('marketer', marketerR1Prompt, [], onMessage, 1);
  conversation.push({ agent: 'marketer', round: 1, content: marketerR1 });

  // Round 1: コピーライターが初稿作成
  const copywriterR1Prompt = buildCopywriterR1Prompt(task, marketerR1);
  const copywriterR1 = await callAgent('copywriter', copywriterR1Prompt, [], onMessage, 1);
  conversation.push({ agent: 'copywriter', round: 1, content: copywriterR1 });

  // Round 1: コンサルタントがフィードバック
  const consultantR1Prompt = buildConsultantR1Prompt(task, marketerR1, copywriterR1);
  const consultantR1 = await callAgent('consultant', consultantR1Prompt, [], onMessage, 1);
  conversation.push({ agent: 'consultant', round: 1, content: consultantR1 });

  // Round 2: コピーライターが修正版を作成
  const copywriterR2Prompt = buildCopywriterR2Prompt(task, copywriterR1, consultantR1);
  const copywriterR2 = await callAgent('copywriter', copywriterR2Prompt, [], onMessage, 2);
  conversation.push({ agent: 'copywriter', round: 2, content: copywriterR2 });

  // Round 2: コンサルタントが最終レビュー
  const consultantR2Prompt = buildConsultantR2Prompt(copywriterR2);
  const consultantR2 = await callAgent('consultant', consultantR2Prompt, [], onMessage, 2);
  conversation.push({ agent: 'consultant', round: 2, content: consultantR2 });

  // Round 3: コピーライターが最終投稿文を確定
  const finalPrompt = buildFinalPrompt(task, copywriterR2, consultantR2);
  const finalPost = await callAgent('copywriter', finalPrompt, [], onMessage, 3);
  conversation.push({ agent: 'copywriter', round: 3, content: finalPost });

  // 最終投稿文を抽出
  const extractedPost = extractFinalPostText(finalPost, task.platform);

  return { conversation, finalPost: extractedPost };
}

async function callAgent(agentRole, prompt, _history, onMessage, round) {
  const agent = AGENTS[agentRole];
  const content = await generateTextFull(agent.systemPrompt, prompt, { maxTokens: 1024 });

  if (onMessage) {
    onMessage({
      agent: agentRole,
      name: agent.name,
      round,
      content,
    });
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
    return `ラーメン体験をInstagramに英語で投稿します。
ラーメン分析: ${JSON.stringify(task.imageAnalysis)}
店名: ${task.restaurantName || '不明'}
場所: ${task.location || '不明'}
訪問日: ${task.visitDate || '不明'}
感想: ${task.impressions || 'なし'}

以下を分析・提案してください：
1. このラーメン投稿に最適なターゲット層（フードラバー、外国人観光客など）
2. 推奨する投稿時間帯
3. Instagramハッシュタグを**必ず20〜30個**提案してください（英語・日本語混合）
   カテゴリ別に：
   - 食事全般（#foodie #food #instafood #foodphotography #yummy など）
   - ラーメン特化（#ramen #ramennoodles #ramenlovers #japaneseramen #noodles など）
   - 日本グルメ（#japanesefood #japanfood #tokyofood など）
   - ラーメンの種類（#tonkotsu #miso #shoyu など該当するもの）
   - 場所タグ（${task.location ? `#${task.location.replace(/\s/g, '')}` : '#tokyo'} など）
   ※Instagramは20〜30個のハッシュタグが最もリーチが高い
4. エンゲージメントを高めるポイント`;
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
    return `ラーメン体験のInstagram投稿文の初稿を英語で作成してください。
ラーメン情報:
- 種類: ${task.imageAnalysis?.ramen_type || 'unknown'}
- 特徴: ${task.imageAnalysis?.english_description || ''}
- 店名: ${task.restaurantName || 'unknown'}
- 場所: ${task.location || 'unknown'}
- 訪問日: ${task.visitDate || 'unknown'}
- 感想: ${task.impressions || ''}
マーケターの分析: ${marketerAnalysis}

要件：
- 魅力的な英語のキャプション（300文字程度）
- 感情的で読者が食べたくなるような表現
- ハッシュタグ（マーケターが提案したもの）を含める
- 絵文字を効果的に使用

投稿文の初稿を作成してください。`;
  }
}

function buildConsultantR1Prompt(task, marketerAnalysis, copywriterDraft) {
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
  const charLimit = task.platform === 'x' ? 'X（Twitter）の280文字以内を厳守してください。' : 'Instagramキャプションとして魅力的にしてください。';
  return `コンサルタントのフィードバックを受けて投稿文を改善してください。

前回の投稿文:
${copywriterR1}

コンサルタントのフィードバック:
${consultantFeedback}

フィードバックを反映した改善版を作成してください。
${charLimit}`;
}

function buildConsultantR2Prompt(copywriterR2) {
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
    return `最終確認を経て、投稿文を確定してください。

現在の投稿文:
${copywriterR2}

コンサルタントの最終レビュー:
${consultantFinalReview}

【最終投稿文】として、投稿するテキストのみを出力してください。
絶対条件：
- 英語のキャプション（2〜3文）を冒頭に書く
- キャプションの末尾に「📲 Find more ramen on Slurp!」という一文を自然に含める
- 空行を1行入れる
- ハッシュタグを20〜30個、末尾にまとめて配置（#ramen #foodie #japanesefood などを含む）
- 前後に説明文を入れず、投稿文そのものだけを出力

出力形式：
[英語キャプション（Slurp紹介文含む）]

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
