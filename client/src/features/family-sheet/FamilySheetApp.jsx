import React, { useEffect, useState } from 'react';
import { Lock, Camera, Pencil, ArrowLeft, Printer, FileDown, Trash2, X, Building2, Upload } from 'lucide-react';
import { useSheetStore } from './useSheetStore';
import Sheet from './Sheet';
import AiPaste from './steps/AiPaste';
import OcrUpload from './steps/OcrUpload';
import PolicyList from './steps/PolicyList';
import PolicyEditor from './steps/PolicyEditor';
import Extra from './steps/Extra';
import { HandoffExport, HandoffImport } from './steps/Handoff';
import { emptyPolicy } from './schema';
import './sheet.css';

// 保険の家族共有シート — 公開ツール(ログイン不要)。
// ステップ式ウィザード1コンテナで画面数を最小に(1人開発方針)。
const STEPS = { lp: 0, start: 1, ai: 2, manual: 3, list: 4, extra: 5, preview: 6, share: 7, ocr: 8, import: 9 };
// ヘッダー戻るボタンの遷移先(各ステップの親)
const BACK = { start: 'lp', ai: 'start', ocr: 'start', manual: 'start', list: 'start', extra: 'list', preview: 'extra', share: 'preview', import: 'start' };

export default function FamilySheetApp() {
  const store = useSheetStore();
  const { sheet, update, addPolicies, clearAll, replaceAll } = store;
  const [step, setStep] = useState(store.hydratedExisting ? STEPS.list : STEPS.lp);
  const [warnings, setWarnings] = useState([]);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false); // 運営APIキーの有無(経路C 可否)

  // 代理店ホワイトレーベル: ?agent= で紹介元を表示し、担当者連絡先が未入力なら初期値に。
  const [agency, setAgency] = useState('');
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('agent');
    if (p) {
      const name = p.slice(0, 60);
      setAgency(name);
      if (!store.sheet.agencyContact) store.update({ agencyContact: name });
    }
    // OCR(経路C)が使えるかをサーバーに確認。使えなければ経路B(貼り付け)にフォールバック。
    let alive = true;
    fetch('/api/family-sheet/config')
      .then((r) => r.json())
      .then((d) => { if (alive) setAiEnabled(!!d.aiEnabled); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const go = (s) => { setStep(s); window.scrollTo(0, 0); };
  const goBack = () => {
    const key = Object.keys(STEPS).find((k) => STEPS[k] === step);
    go(STEPS[BACK[key] ?? 'lp']);
  };

  const savePolicy = (p) => {
    const exists = sheet.policies.some((x) => x.id === p.id);
    update({ policies: exists ? sheet.policies.map((x) => (x.id === p.id ? p : x)) : [...sheet.policies, p] });
  };
  const deletePolicy = (id) => update({ policies: sheet.policies.filter((x) => x.id !== id) });

  const onExtracted = (policies, w) => {
    addPolicies(policies);
    setWarnings(w || []);
    go(STEPS.list);
  };

  return (
    <div className="min-h-screen bg-amber-50 text-stone-800">
      {/* ヘッダー: 常時プライバシーバッジ */}
      <header className="sticky top-0 z-30 border-b border-amber-100 bg-amber-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          {step !== STEPS.lp && (
            <button onClick={goBack} className="text-stone-400 hover:text-stone-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <span className="font-bold text-stone-900">保険の家族共有シート</span>
          <button
            onClick={() => setPrivacyOpen(true)}
            className="ml-auto flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
          >
            <Lock className="w-3.5 h-3.5" />この端末の中だけ
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 print:hidden">
        {agency && step === STEPS.lp && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-white p-3 text-sm text-emerald-800">
            <Building2 className="mr-1 inline w-4 h-4" />{agency} のご紹介でご利用中です（{agency}にあなたの入力内容は渡りません）
          </div>
        )}

        {step === STEPS.lp && <Landing onStart={() => go(STEPS.start)} agency={agency} />}
        {step === STEPS.start && (
          <StartChoice
            onAi={() => go(aiEnabled ? STEPS.ocr : STEPS.ai)}
            onManual={() => go(STEPS.manual)}
            onImport={() => go(STEPS.import)}
          />
        )}
        {step === STEPS.ocr && (
          <OcrUpload
            onExtracted={onExtracted}
            onBack={() => go(STEPS.start)}
            onManual={(m) => go(m === 'paste' ? STEPS.ai : STEPS.manual)}
          />
        )}
        {step === STEPS.ai && (
          <AiPaste onExtracted={onExtracted} onBack={() => go(STEPS.start)} onManual={() => go(STEPS.manual)} />
        )}
        {step === STEPS.import && (
          <HandoffImport
            onImport={(s) => { replaceAll(s); setWarnings([]); go(STEPS.list); }}
            onCancel={() => go(STEPS.start)}
          />
        )}
        {step === STEPS.manual && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-stone-900">保険を入力する</h2>
            <PolicyEditor
              policy={emptyPolicy()}
              onCancel={() => go(STEPS.start)}
              onSave={(p) => { savePolicy(p); go(STEPS.list); }}
            />
          </div>
        )}
        {step === STEPS.list && (
          <PolicyList
            policies={sheet.policies}
            warnings={warnings}
            onSave={savePolicy}
            onDelete={deletePolicy}
            onNext={() => go(STEPS.extra)}
            onBack={() => go(STEPS.start)}
          />
        )}
        {step === STEPS.extra && (
          <Extra sheet={sheet} update={update} onNext={() => go(STEPS.preview)} onBack={() => go(STEPS.list)} />
        )}
        {step === STEPS.preview && (
          <Preview sheet={sheet} onEdit={() => go(STEPS.list)} onShare={() => go(STEPS.share)} />
        )}
        {step === STEPS.share && (
          <Share
            agency={agency}
            sheet={sheet}
            onEdit={() => go(STEPS.preview)}
            onClear={() => setConfirmClear(true)}
          />
        )}
      </main>

      {/* 印刷対象。画面では preview/share のときだけ見せる */}
      {(step === STEPS.preview || step === STEPS.share) && (
        <div className="fs-print-area mx-auto max-w-2xl px-4 pb-16 print:px-0 print:pb-0">
          <Sheet sheet={sheet} />
        </div>
      )}

      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
      {confirmClear && (
        <ConfirmClear
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => { clearAll(); setConfirmClear(false); setWarnings([]); go(STEPS.lp); }}
        />
      )}
    </div>
  );
}

/* ---------- LP ---------- */
function Landing({ onStart, agency }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold leading-snug text-stone-900">
          もしものとき、<br />家族が保険を<br />請求できますか？
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-stone-700">
          加入している保険を1枚のシートにまとめて、家族に渡せます。<br />
          無料・登録不要・約15分。
        </p>
      </div>

      <div>
        <button onClick={onStart} className="w-full rounded-xl bg-orange-600 py-4 text-xl font-bold text-white shadow-sm hover:bg-orange-700">
          無料でシートを作る
        </button>
        <p className="mt-2 flex items-start gap-1.5 text-sm text-stone-500">
          <Lock className="mt-0.5 w-4 h-4 flex-shrink-0" />
          入力した内容がサーバーに送られて保存されることはありません。
        </p>
      </div>

      <div className="rounded-xl bg-white p-4 border border-amber-100">
        <div className="text-sm font-semibold text-stone-500">あなただけではありません</div>
        <p className="mt-1 text-stone-700">
          家族に保険の話を「まったくしていない」人は <strong className="text-orange-600">48.9%</strong>。<br />
          保険の一覧化がまだの方は <strong className="text-orange-600">約7割</strong>。
        </p>
        <p className="mt-1 text-xs text-stone-400">出典: 終活協議会「保険の見直しに関する実態調査」2026年</p>
      </div>

      <div className="rounded-xl bg-white p-4 border border-amber-100">
        <div className="text-sm font-semibold text-stone-500">かんたん3ステップ</div>
        <ol className="mt-2 space-y-1 text-stone-700">
          <li>① 証券の写真で読み取る（手入力でもOK）</li>
          <li>② 内容を確認する</li>
          <li>③ 印刷して家族に渡す</li>
        </ol>
      </div>

      <button onClick={onStart} className="w-full rounded-xl bg-orange-600 py-4 text-xl font-bold text-white shadow-sm hover:bg-orange-700">
        無料でシートを作る
      </button>

      <p className="text-center text-sm text-stone-400">
        提供: Cocreo（コクレオ）{!agency && <> ・ <a href="/cocreo" className="underline">保険代理店の方へ</a></>}
      </p>
    </div>
  );
}

/* ---------- 入力方法の選択 ---------- */
function StartChoice({ onAi, onManual, onImport }) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-stone-900">保険の情報を<br />どのように入れますか？</h2>
      <button onClick={onAi} className="w-full rounded-xl border-2 border-emerald-300 bg-emerald-50/60 p-5 text-left hover:bg-emerald-50">
        <div className="flex items-center gap-2 text-lg font-bold text-emerald-900">
          <Camera className="w-6 h-6" />証券の写真で読み取る（おすすめ）
        </div>
        <p className="mt-1 text-stone-600">保険証券や、保険会社マイページの画面写真から、AIで読み取ります。</p>
      </button>
      <button onClick={onManual} className="w-full rounded-xl border-2 border-stone-200 bg-white p-5 text-left hover:bg-stone-50">
        <div className="flex items-center gap-2 text-lg font-bold text-stone-800">
          <Pencil className="w-6 h-6" />自分で入力する
        </div>
        <p className="mt-1 text-stone-600">証券が手元にない方、写真が苦手な方はこちら。</p>
      </button>
      <p className="text-sm text-stone-500">
        💡 証券が見つからない場合も、保険会社名と連絡先だけでシートは作れます。
      </p>
      <button onClick={onImport} className="flex w-full items-center justify-center gap-1.5 text-emerald-700 underline">
        <Upload className="w-4 h-4" />代理店に作ってもらった下書きを読み込む
      </button>
    </div>
  );
}

/* ---------- プレビュー ---------- */
function Preview({ onEdit, onShare }) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-3xl">✿</div>
        <h2 className="mt-2 text-2xl font-bold text-stone-900">できあがりました。</h2>
        <p className="mt-1 text-stone-600">これで、もしものときも、ご家族は保険のことで困りません。</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onEdit} className="flex-1 rounded-lg border border-stone-300 py-3 text-lg font-semibold text-stone-600 hover:bg-stone-50">
          内容を直す
        </button>
        <button onClick={onShare} className="flex-1 rounded-lg bg-emerald-700 py-3 text-lg font-semibold text-white hover:bg-emerald-800">
          印刷・保存へすすむ
        </button>
      </div>
      <p className="text-center text-sm text-stone-400">↓ 下に完成したシートが表示されています</p>
    </div>
  );
}

/* ---------- 共有・印刷 ---------- */
function Share({ agency, sheet, onEdit, onClear }) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-stone-900">シートを家族に渡しましょう</h2>
      <div className="grid gap-3">
        <button onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-lg bg-emerald-700 py-4 text-lg font-semibold text-white hover:bg-emerald-800">
          <FileDown className="w-5 h-5" />PDFで保存する（おすすめ）
        </button>
        <button onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-lg border border-stone-300 py-4 text-lg font-semibold text-stone-700 hover:bg-stone-50">
          <Printer className="w-5 h-5" />印刷する
        </button>
        <p className="text-sm text-stone-500">
          「PDFで保存」は、印刷画面で送信先（プリンター）を「PDFに保存」に変えると、A4のPDFファイルになります。家族に送ったり、家に保管しておけます。コンビニ印刷にも使えます。
        </p>
      </div>

      <HandoffExport sheet={sheet} note="別の端末に移したいときや、あとで続きを直したいときは、下書きをファイルに保存できます（この端末に残す以外の控えになります）。" />

      <div className="rounded-xl bg-white p-4 border border-amber-100 space-y-2 text-stone-700">
        <div className="font-semibold text-stone-500">渡し方のヒント</div>
        <p>・封筒に入れて、保険証券と同じ場所に保管しましょう。</p>
        <p>・置き場所を家族に伝えるだけでも十分です。</p>
        <p>・渡すときのひとこと例:「保険のことをまとめてみたよ。引き出しに入れておくからね」</p>
      </div>

      <div className="rounded-xl bg-white p-4 border border-amber-100 text-stone-700">
        <div className="font-semibold text-stone-500">これからのこと</div>
        <p className="mt-1">年に1回、内容を見直しましょう。このページをブックマークしておくと便利です。</p>
        <p className="mt-2 flex items-start gap-1.5 text-sm text-stone-500">
          <Lock className="mt-0.5 w-4 h-4 flex-shrink-0" />
          データはこの端末の中に残ります。消したいときは下のボタンを押してください。
        </p>
        <button onClick={onClear} className="mt-2 flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700">
          <Trash2 className="w-4 h-4" />この端末からすべて消す
        </button>
      </div>

      <button onClick={onEdit} className="w-full rounded-lg border border-stone-300 py-3 font-semibold text-stone-600 hover:bg-stone-50">
        プレビューにもどる
      </button>

      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
        このツールは Cocreo が無料で提供しています。
        {agency
          ? <> 協力: {agency}。</>
          : <> <strong className="text-stone-700">保険代理店の方へ</strong>: お客様サービスとしてこのツールを使いませんか？ <a href="/cocreo" className="text-emerald-700 underline">詳しく見る</a></>}
      </div>
    </div>
  );
}

/* ---------- プライバシー説明モーダル ---------- */
function PrivacyModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center print:hidden" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-900">あなたの情報の扱いについて</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
        </div>
        <ul className="mt-3 space-y-2 text-stone-700">
          <li>・入力した内容は、お使いのスマホ（パソコン）の中にだけ保存されます。</li>
          <li>・私たちのサーバーに送られて保存されることはありません。</li>
          <li>・写真をAIで読み取る場合も、写真はご自身のAI（Claude／ChatGPT）で処理され、このサイトを通りません。</li>
          <li>・「すべて消す」を押せば、いつでも完全に消せます。</li>
        </ul>
        <p className="mt-3 text-stone-600">だから、会員登録もパスワードも必要ありません。</p>
        <button onClick={onClose} className="mt-4 w-full rounded-lg bg-stone-800 py-3 font-semibold text-white">閉じる</button>
      </div>
    </div>
  );
}

function ConfirmClear({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-center">
        <p className="text-lg font-bold text-stone-900">本当に消しますか？</p>
        <p className="mt-1 text-stone-600">消すと元に戻せません。</p>
        <div className="mt-4 flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-lg border border-stone-300 py-3 font-semibold text-stone-600">消さない</button>
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-500 py-3 font-semibold text-white">消す</button>
        </div>
      </div>
    </div>
  );
}
