import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import CocreoHeader from './components/CocreoHeader';
import CaseIntakeForm from './components/CaseIntakeForm';
import CaseProposalView from './components/CaseProposalView';
import CaseChatView from './components/CaseChatView';
import { generateProposal } from '../../lib/cocreo/cases';

/**
 * 「AIコンサル」機能は現在オフにしている。
 *
 * 理由: この画面は「AIエージェントが分析中」と表示していたが、実際には
 * AIを一度も呼んでいなかった。
 *   - lib/cocreo/cases.js の generateProposal() は固定テンプレートの穴埋め
 *   - components/CaseChatView.jsx の応答は agentId ごとのハードコード辞書で、
 *     ユーザーの入力内容を反映しない
 * 表示と実装が乖離した状態で公開し続けるのは、金融業（保険代理店）を顧客に
 * する事業として許容できないため、実装が伴うまで導線ごと閉じる。
 *
 * 再開の条件: services/claudeFallback.js の方式（顧客自身のAIアカウントで
 * プロンプトを実行してもらう）に載せ替え、生成が実際に行われるようにすること。
 * その際にこのフラグを true にする。
 */
const CONSULTING_ENABLED = false;

export default function CocreoConsulting() {
  const navigate = useNavigate();
  const [step, setStep] = useState('intake');
  const [projectCase, setProjectCase] = useState(null);
  const [proposal, setProposal] = useState(null);

  const handleSubmitCase = (newCase) => {
    setProjectCase(newCase);
    setProposal(generateProposal(newCase));
    setStep('proposal');
  };

  const handleStartChat = () => setStep('chat');

  const handleBack = () => {
    if (step === 'chat') setStep('proposal');
    else if (step === 'proposal') setStep('intake');
    else navigate(-1);
  };

  if (!CONSULTING_ENABLED) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <CocreoHeader onBack={() => navigate(-1)} currentPage="準備中" breadcrumb={[{ label: '準備中' }]} />
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-lg text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-6" style={{ backgroundColor: 'rgba(201,137,31,0.12)' }}>
              <AlertCircle className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              このページは現在ご利用いただけません
            </h1>
            <p className="text-sm leading-7 mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              提案内容の生成部分を作り直しているため、一時的に公開を停止しています。
              ご相談はメールで承っております。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:contact@cocreo.jp?subject=Cocreo%20%E3%81%94%E7%9B%B8%E8%AB%87"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                メールで相談する
              </a>
              <Link
                to="/cocreo/subsidy-generator"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border text-sm font-medium"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                補助金の申請書テンプレートを作る
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <CocreoHeader onBack={handleBack} currentPage="課題整理" breadcrumb={[{ label: '課題整理' }]} />

      {step === 'intake' && <CaseIntakeForm onSubmit={handleSubmitCase} />}

      {step === 'proposal' && projectCase && proposal && (
        <CaseProposalView projectCase={projectCase} proposal={proposal} onStartChat={handleStartChat} />
      )}

      {step === 'chat' && projectCase && proposal && (
        <CaseChatView projectCase={projectCase} proposal={proposal} />
      )}
    </div>
  );
}
