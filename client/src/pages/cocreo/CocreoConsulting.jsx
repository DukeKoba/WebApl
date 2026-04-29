import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CocreoHeader from './components/CocreoHeader';
import CaseIntakeForm from './components/CaseIntakeForm';
import CaseProposalView from './components/CaseProposalView';
import CaseChatView from './components/CaseChatView';
import { generateProposal } from '../../lib/cocreo/cases';

export default function CocreoConsulting() {
  const navigate = useNavigate();
  const [step, setStep] = useState("intake");
  const [projectCase, setProjectCase] = useState(null);
  const [proposal, setProposal] = useState(null);

  const handleSubmitCase = (newCase) => {
    setProjectCase(newCase);
    setStep("analyzing");
    setTimeout(() => {
      const generated = generateProposal(newCase);
      setProposal(generated);
      setStep("proposal");
    }, 3000);
  };

  const handleStartChat = () => setStep("chat");

  const handleBack = () => {
    if (step === "chat") setStep("proposal");
    else if (step === "proposal") setStep("intake");
    else navigate(-1);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <CocreoHeader onBack={handleBack} currentPage="AIコンサル" breadcrumb={[{ label: "AIコンサル" }]} />

      {step === "intake" && <CaseIntakeForm onSubmit={handleSubmitCase} />}

      {step === "analyzing" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 rounded-full" style={{ borderColor: 'rgba(201,137,31,0.2)' }} />
              <div className="absolute inset-0 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
              <div className="absolute inset-3 border-4 rounded-full" style={{ borderColor: 'rgba(239,201,121,0.2)' }} />
              <div className="absolute inset-3 border-4 border-b-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-secondary)', borderBottomColor: 'transparent', animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            <h2 className="text-xl font-bold mb-2">AIエージェントが分析中...</h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              {projectCase?.companyName}様の課題を分析し、最適なエージェントチームと施策を検討しています
            </p>
            <div className="mt-6 space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <p className="animate-fade-in" style={{ animationDelay: "0.5s" }}>経営戦略コンサルタントが課題を構造化中...</p>
              <p className="animate-fade-in" style={{ animationDelay: "1.5s" }}>専門エージェントをアサイン中...</p>
              <p className="animate-fade-in" style={{ animationDelay: "2.5s" }}>オーダーメイドの提案書を作成中...</p>
            </div>
          </div>
        </div>
      )}

      {step === "proposal" && projectCase && proposal && (
        <CaseProposalView projectCase={projectCase} proposal={proposal} onStartChat={handleStartChat} />
      )}

      {step === "chat" && projectCase && proposal && (
        <CaseChatView projectCase={projectCase} proposal={proposal} />
      )}
    </div>
  );
}
