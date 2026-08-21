import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Scroll, Sparkles, History, ArrowLeft, Download, Zap,
  CheckCircle2, RefreshCw, AlertTriangle, FileText, Copy, Check, ExternalLink,
  ChevronRight, Bot
} from 'lucide-react';
import PostPreview from '../../components/shared/PostPreview';
import AiModeToggle, { useAiMode } from '../../components/shared/AiModeToggle';
import PromptFallbackPanel from '../../components/shared/PromptFallbackPanel';
import { authFetch } from '../../utils/api';

const HISTORY_TYPES = [
  {
    value: 'japanese_center_qa',
    label: '🇯🇵 日本史 センター1問1答',
    badge: '共通テスト良問',
    badgeColor: 'bg-amber-600 text-white',
    desc: '正誤判定・因果関係・年表把握の1問1答',
    color: 'from-amber-600 to-red-600',
    hints: [
      '古代・ヤマト政権〜律令国家（国分寺建立・墾田永年私財法などの政策と天皇）',
      '平安・摂関政治と院政（藤原道長・白河上皇・保元平治の乱の因果）',
      '中世・鎌倉〜室町幕府（御恩と奉公・惣村・応仁の乱の構造）',
      '織豊政権・太閤検地と刀狩（兵農分離の意義）',
      '江戸初期・幕藩体制（武家諸法度・鎖国の完成手順）',
      '江戸中期・三大改革（享保・寛政・天保の政策の違いと結果）',
      '幕末・開国から明治維新（日米修好通商条約・尊皇攘夷・倒幕の流れ）',
      '明治・立憲体制と日清日露戦争（大日本帝国憲法・条約改正）',
      '大正・デモクラシーと政党政治（普通選挙法・治安維持法）',
      '昭和・恐慌から戦時体制・戦後改革（農地改革・財閥解体・日本国憲法）',
    ],
    hashtags: '#日本史 #共通テスト #大学受験',
    isQa: true,
  },
  {
    value: 'world_center_qa',
    label: '🌍 世界史 センター1問1答',
    badge: '共通テスト良問',
    badgeColor: 'bg-blue-600 text-white',
    desc: '王朝史・革命・世界の一体化の1問1答',
    color: 'from-blue-600 to-indigo-600',
    hints: [
      'オリエント・地中海世界（アケメネス朝・ポリス民主政・ローマ帝国）',
      '中国王朝史（秦・漢の統一政策・唐の律令制・宋の文治主義）',
      'イスラム世界（ウマイヤ朝・アッバース朝・オスマン帝国の拡大）',
      '中世ヨーロッパ（封建社会・十字軍・教皇権の盛衰）',
      'ルネサンス・大航海時代・宗教改革（世界の一体化と商業革命）',
      '主権国家体制・絶対王政（三十年戦争・ルイ14世・議会政治）',
      '市民革命・産業革命（アメリカ独立・フランス革命・ナポレオン）',
      '19世紀の欧米（ウィーン体制・イタリア/ドイツ統一・帝国主義）',
      '第一次世界大戦・ロシア革命・ヴェルサイユ体制',
      '第二次世界大戦・冷戦構造（キューバ危機・中東戦争・東欧革命）',
    ],
    hashtags: '#世界史 #共通テスト #大学受験',
    isQa: true,
  },
  {
    value: 'same_era_qa',
    label: '🔄 同時代比較 センター1問1答',
    badge: '差がつく良問',
    badgeColor: 'bg-purple-600 text-white',
    desc: '「同じ年に世界では？」を問う横断1問1答',
    color: 'from-purple-600 to-pink-600',
    hints: [
      '1600年頃: 関ヶ原の戦いの時、ヨーロッパでは何が起きていた？（東インド会社・三十年戦争前夜）',
      '1192/1185年: 鎌倉幕府成立の頃、中国や中東では？（南宋・第3回十字軍）',
      '1853/1868年: ペリー来航・明治維新の頃、清や欧米では？（アヘン戦争/太平天国・南北戦争・普仏戦争）',
      '710/794年: 奈良・平安初期、世界では何帝国が最盛期？（唐・アッバース朝・カール大帝）',
      '1543/1549年: 鉄砲伝来・キリスト教伝来と大航海時代（宗教改革・イエズス会）',
      '1904年: 日露戦争の頃、ヨーロッパの同盟関係は？（英仏協商・三国協商）',
    ],
    hashtags: '#日本史 #世界史 #大学受験',
    isQa: true,
  },
  {
    value: 'japanese_history',
    label: '🇯🇵 日本史 要点・因果解説',
    badge: '流れと因果',
    badgeColor: 'bg-gray-700 text-white',
    desc: '幕府・改革・明治維新の重要ポイント',
    color: 'from-gray-700 to-gray-900',
    hints: [
      '鎌倉幕府の成立をめぐる年号と実態のズレ',
      '応仁の乱が戦国時代を生んだ流れ',
      '織豊政権の政策（検地・刀狩）の狙い',
      '江戸幕府の三大改革の違いと結果',
      '開国から明治維新までの条約と国内対立',
      '自由民権運動と憲法制定の流れ',
      '大正デモクラシーと政党政治',
      '昭和恐慌から戦時体制への転換点',
      '戦後改革（農地改革・財閥解体）の中身',
    ],
    hashtags: '#日本史 #大学受験',
    isQa: false,
  },
  {
    value: 'world_history',
    label: '🌍 世界史 要点・因果解説',
    badge: '流れと因果',
    badgeColor: 'bg-gray-700 text-white',
    desc: '市民革命・大航海・冷戦の重要ポイント',
    color: 'from-gray-700 to-gray-900',
    hints: [
      '十字軍が結果的に何を変えたか',
      'ルネサンスと宗教改革のつながり',
      '大航海時代がもたらした世界の一体化',
      '市民革命（英・米・仏）の共通点と違い',
      '産業革命が社会構造をどう変えたか',
      'ウィーン体制とその崩壊',
      '帝国主義とアフリカ分割',
      '第一次世界大戦の原因と戦後処理',
      '冷戦の始まりと分断の構造',
    ],
    hashtags: '#世界史 #大学受験',
    isQa: false,
  },
  {
    value: 'mnemonic',
    label: '💡 年号の覚え方（ゴロ合わせ）',
    badge: '暗記ハック',
    badgeColor: 'bg-teal-600 text-white',
    desc: '紛らわしい重要年号の語呂合わせ',
    color: 'from-teal-600 to-cyan-600',
    hints: [
      '中世の重要年号のゴロ合わせ',
      '近世（江戸）の重要年号のゴロ合わせ',
      '近代（明治〜大正）の重要年号のゴロ合わせ',
      '世界史の重要年号のゴロ合わせ',
    ],
    hashtags: '#日本史 #世界史 #受験勉強',
    isQa: false,
  },
];

const KOYOMI_URL = 'https://apps.apple.com/jp/app/id6794647918';

function buildLocalHistoryPrompt(contentType) {
  const type = HISTORY_TYPES.find(t => t.value === contentType) || HISTORY_TYPES[0];
  const variety = type.hints[Math.floor(Math.random() * type.hints.length)];

  const system = 'あなたはSNSマーケティングと高校歴史教育の専門家です。事実の正確さを最優先しつつ、Xで圧倒的に伸びる書き方を熟知しています。';

  let user = '';
  if (type.isQa) {
    user = `大学入試センター試験・共通テスト相当の【${type.label}】の1問1答問題をX（旧Twitter）に投稿します。
ターゲット: 共通テスト・大学入試で日本史/世界史を受験する高校生・浪人生
テーマ・時代: ${variety}

【問題の要件（センター試験・共通テストレベルの良問）】
- 教科書の重要事項・正誤判定・因果関係・同時代把握に直結する良問を作成してください。
- 難易度: センター試験・共通テスト標準〜やや難（正答率40〜60%の差がつく問題）。

【本文の構成（厳守）】
1行目: フック（例:「【センター${type.label.includes('日本史') ? '日本史' : '世界史'}】9割が悩む正誤判定。あなたは解けますか？」「【共通テスト頻出】差がつく1問👇」）
2. 📝【問題文】（時代背景を簡潔に示し、下線部や設問を提示）
3. 選択肢: ① 〜  ② 〜 （※紛らわしく考えさせる2択。教科書に明確な根拠があるもの）
4. 締め: 「①と②どっちが正しい？理由をリプで教えてください👇（正解と年表・因果関係の解説はリプ欄へ）」

【リプライの構成（厳守）】
- 正解（「正解は①（または②）！」）
- なぜそれが正解か、もう一方がなぜ誤りかの詳細な解説（年号・背景・因果関係）
- 年表での位置づけや覚え方のポイント

【出力フォーマット（厳守）】
===本文===
（X本文。日本語で約120〜130文字程度。URLやハッシュタグは書かない）
===リプライ===
（正解と解説。日本語で約100文字程度。URLやハッシュタグは書かない）`;
  } else {
    user = `${type.label}の学習コンテンツをX（旧Twitter）に投稿します。
ターゲット: 大学受験で日本史・世界史を使う高校生・浪人生
テーマ: ${variety}

【内容の要件】
- 高校の教科書・入試で扱われる範囲の定説だけを書く
- 年号・人名・出来事は確実なものだけ使う
- 用語の暗記ではなく「なぜそうなったか」の因果や流れが分かる内容にする

【出力フォーマット（厳守）】
===本文===
（X本文。1行目に強力なフック、箇条書きを活用して約120〜130文字。URLやハッシュタグは書かない）
===リプライ===
（背景や詳細解説。約100文字。URLやハッシュタグは書かない）`;
  }

  return {
    label: `${type.label} 生成プロンプト`,
    system,
    user,
  };
}

function HistoryBatchSection() {
  const [aiMode] = useAiMode();
  const [batchPrompts, setBatchPrompts] = useState(null);
  const [copiedBatch, setCopiedBatch] = useState(false);

  const handleGenerateBatchPrompts = () => {
    const scheduleTemplate = [
      { type: 'japanese_center_qa', day: '月曜', title: '🇯🇵 日本史 センター1問1答' },
      { type: 'world_center_qa', day: '火曜', title: '🌍 世界史 センター1問1答' },
      { type: 'same_era_qa', day: '水曜', title: '🔄 同時代 センター1問1答' },
      { type: 'japanese_history', day: '木曜', title: '🇯🇵 日本史 重要因果解説' },
      { type: 'world_history', day: '金曜', title: '🌍 世界史 重要因果解説' },
      { type: 'mnemonic', day: '土曜', title: '💡 年号ゴロ合わせ' },
      { type: 'japanese_center_qa', day: '日曜', title: '🇯🇵 日本史 週末良問演習' },
    ];

    const prompts = scheduleTemplate.map(item => {
      const p = buildLocalHistoryPrompt(item.type);
      return {
        day: item.day,
        title: item.title,
        label: `【${item.day}】${item.title} プロンプト`,
        system: p.system,
        user: p.user,
      };
    });

    const fullPromptCombined = `【高校歴史 X投稿 1週間分（7投稿）の一括生成指示】\n\n以下の7つのテーマに従って、それぞれの投稿本文とリプライを出力してください。\n各投稿は「===Day 1===」「===Day 2===」で区切って出力してください。\n\n` +
      prompts.map((p, i) => `--- Day ${i + 1} (${p.day}: ${p.title}) ---\n${p.user}`).join('\n\n');

    setBatchPrompts({ prompts, combined_prompt: fullPromptCombined });
  };

  const handleCopyCombined = () => {
    if (!batchPrompts?.combined_prompt) return;
    navigator.clipboard.writeText(batchPrompts.combined_prompt);
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-amber-800 via-orange-800 to-yellow-900 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h2 className="font-bold text-lg">歴史 1週間分（7問）の一括量産ジェネレーター</h2>
        </div>
        <p className="text-sm text-amber-100 leading-relaxed mb-4">
          日本史共テ問・世界史共テ問・同時代比較・因果関係解説・年号ゴロ合わせなど、1週間分のストックを一撃で作成できます。
        </p>

        <button
          onClick={handleGenerateBatchPrompts}
          className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-gray-900 font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4 fill-gray-900" />
          <span>1週間分（7投稿分）のプロンプトを一括作成</span>
        </button>
      </div>

      {batchPrompts && (
        <div className="space-y-4 bg-amber-50/60 border-2 border-amber-300 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-700" />
              1週間分（7投稿）の生成プロンプト一覧
            </h3>
            <button
              onClick={handleCopyCombined}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md ${
                copiedBatch ? 'bg-green-600 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              {copiedBatch ? <><Check className="w-4 h-4" />7日分まとめてコピー完了！</> : <><Copy className="w-4 h-4" />7日分まとめて一括コピー</>}
            </button>
          </div>

          <p className="text-xs text-gray-600">
            「7日分まとめて一括コピー」を押して ChatGPT や Claude に貼り付けると、月〜日の7日分の投稿が一気に生成されます。
          </p>

          <div className="space-y-3">
            {batchPrompts.prompts?.map((p, idx) => (
              <div key={idx} className="bg-white border border-amber-200 rounded-xl p-3.5 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-gray-900">{p.label}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${p.system ? `【システム】\n${p.system}\n\n` : ''}${p.user}`);
                      alert(`${p.day}のプロンプトをコピーしました！`);
                    }}
                    className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" /> コピー
                  </button>
                </div>
                <p className="text-xs text-gray-700 font-mono bg-gray-50 p-2.5 rounded-lg max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {p.user}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function KoyomiHome() {
  const [tab, setTab] = useState('single');
  const [aiMode] = useAiMode();
  const promptOnly = aiMode === 'prompt';

  const [contentType, setContentType] = useState('japanese_center_qa');
  const [isGenerating, setIsGenerating] = useState(false);
  const [postText, setPostText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [postId, setPostId] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState('draft');
  const [error, setError] = useState('');
  const [fallbackPrompt, setFallbackPrompt] = useState(null);
  const outputRef = useRef(null);

  const resetOutput = () => {
    setPostText('');
    setReplyText('');
    setPostId(null);
    setStatus('draft');
    setError('');
    setFallbackPrompt(null);
  };

  useEffect(() => {
    if ((postText || fallbackPrompt || error) && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [postText, fallbackPrompt, error]);

  // プロンプト生成ボタン押下時のハンドラー
  const handleGenerateClick = async () => {
    resetOutput();

    // 📄 プロンプト生成モード（標準）: サーバー通信を待たずに即時生成！
    if (promptOnly) {
      const p = buildLocalHistoryPrompt(contentType);
      setFallbackPrompt({
        prompts: [p],
        reason: 'prompt_only',
      });
      return;
    }

    // 🤖 API直接実行モード
    setIsGenerating(true);
    try {
      const res = await authFetch('/koyomi/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, prompt_only: false }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let event = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            event = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (event === 'final_post') {
                setPostText(data.post_text);
                setReplyText(data.reply_text || '');
                setPostId(data.post_id);
              } else if (event === 'fallback_prompt') {
                setFallbackPrompt(data);
              } else if (event === 'error') {
                setError(data.message);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      // API直接実行でエラーの場合は即座にプロンプト表示にフォールバック
      const p = buildLocalHistoryPrompt(contentType);
      setFallbackPrompt({
        prompts: [p],
        reason: 'api_error',
        errorMessage: err.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveManualResult = async (pastedText) => {
    try {
      const res = await authFetch('/koyomi/save-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, body_text: pastedText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPostText(data.post_text);
      setReplyText(data.reply_text);
      setPostId(data.post_id);
      setFallbackPrompt(null);
    } catch (err) {
      setError(`保存エラー: ${err.message}`);
    }
  };

  const handlePublish = async (id) => {
    setIsPublishing(true);
    try {
      const res = await authFetch(`/koyomi/posts/${id}/publish`, { method: 'POST' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setStatus('posted');
      if (result.reply_error) {
        setError(`本文は投稿できましたが、リプライに失敗しました: ${result.reply_error}`);
      }
    } catch (err) {
      setError(err.message);
      setStatus('failed');
    } finally {
      setIsPublishing(false);
    }
  };

  const tabs = [
    { value: 'single', label: '📜 センター1問1答 生成', icon: Scroll, color: 'bg-gradient-to-r from-amber-700 to-orange-600 text-white' },
    { value: 'batch', label: '⚡ 1週間分 一括量産', icon: Zap, color: 'bg-gradient-to-r from-yellow-600 to-amber-700 text-white' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-700 to-orange-600 rounded-lg flex items-center justify-center shadow-xs">
                <Scroll className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base text-gray-900 leading-tight">日本史・世界史 X投稿ジェネレーター</h1>
                <p className="text-[11px] text-gray-500">センター試験・共通テスト1問1答 ＆ Koyomi連動</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AiModeToggle />
            <Link
              to="/koyomi/history"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
            >
              <History className="w-4 h-4 text-gray-500" />
              投稿履歴
            </Link>
          </div>
        </div>
      </div>

      {/* Main Tab Nav */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => {
                  setTab(t.value);
                  resetOutput();
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? `${t.color} shadow-sm scale-[1.02]`
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Koyomi 導線バナー */}
        <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-600 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
          <div>
            <span className="bg-white/20 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              Koyomi -暦- 連動
            </span>
            <h2 className="font-extrabold text-base mt-1">センター試験・共通テスト 1問1答ジェネレーター</h2>
            <p className="text-xs text-amber-100 mt-0.5">
              正誤判定や因果関係を問う良問を生成。リプライに正解解説とKoyomiアプリリンクが付きます。
            </p>
          </div>
          <a
            href={KOYOMI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-black/60 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            App Store
          </a>
        </div>

        {tab === 'batch' && <HistoryBatchSection />}

        {tab === 'single' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-xs">
              <span className="text-xs font-bold text-gray-800 block">問題タイプ・ジャンルを選択</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {HISTORY_TYPES.map(h => {
                  const isSelected = contentType === h.value;
                  return (
                    <button
                      key={h.value}
                      onClick={() => setContentType(h.value)}
                      className={`text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-500'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-gray-900">{h.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${h.badgeColor}`}>
                          {h.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">{h.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* 生成ボタン */}
              <button
                onClick={handleGenerateClick}
                disabled={isGenerating}
                className="w-full py-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 disabled:from-gray-400 disabled:to-gray-500 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg hover:scale-[1.005]"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI生成中...</span>
                  </>
                ) : (
                  <>
                    {promptOnly ? <FileText className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    <span>{promptOnly ? '✨ センター試験1問1答の生成プロンプトを作成' : '🤖 センター試験レベルの1問1答を直接AI生成'}</span>
                  </>
                )}
              </button>
            </div>

            <div ref={outputRef} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {fallbackPrompt && (
                <PromptFallbackPanel
                  prompts={fallbackPrompt.prompts}
                  reason={fallbackPrompt.reason}
                  errorMessage={fallbackPrompt.errorMessage}
                  onSave={handleSaveManualResult}
                />
              )}

              {postText && (
                <PostPreview
                  platform="x"
                  text={postText}
                  onChange={postId ? setPostText : undefined}
                  postId={postId}
                  onPublish={handlePublish}
                  isPublishing={isPublishing}
                  status={status}
                  ctaText={replyText}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
