"use client";

import { useState } from "react";
import Header from "@/components/Header";
import CaseIntakeForm from "@/components/consulting/CaseIntakeForm";
import CaseProposalView from "@/components/consulting/CaseProposalView";
import CaseChatView from "@/components/consulting/CaseChatView";
import { ProjectCase, CaseProposal } from "@/lib/cases";
import { generateProposal } from "@/lib/cases";

type Step = "intake" | "analyzing" | "proposal" | "chat";

export default function ConsultingPage() {
  const [step, setStep] = useState<Step>("intake");
  const [projectCase, setProjectCase] = useState<ProjectCase | null>(null);
  const [proposal, setProposal] = useState<CaseProposal | null>(null);

  const handleSubmitCase = (newCase: ProjectCase) => {
    setProjectCase(newCase);
    setStep("analyzing");

    // Simulate AI analysis time
    setTimeout(() => {
      const generated = generateProposal(newCase);
      setProposal(generated);
      setStep("proposal");
    }, 3000);
  };

  const handleStartChat = (agentId: string) => {
    setStep("chat");
  };

  const handleBack = () => {
    if (step === "chat") setStep("proposal");
    else if (step === "proposal") setStep("intake");
    else window.history.back();
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header
        onBack={handleBack}
        currentPage="AIコンサル"
        breadcrumb={[{ label: "AIコンサル" }]}
      />

      {step === "intake" && (
        <CaseIntakeForm onSubmit={handleSubmitCase} />
      )}

      {step === "analyzing" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-3 border-4 border-secondary/20 rounded-full" />
              <div className="absolute inset-3 border-4 border-secondary border-b-transparent rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
            </div>
            <h2 className="text-xl font-bold mb-2">AIエージェントが分析中...</h2>
            <p className="text-text-secondary text-sm max-w-md mx-auto">
              {projectCase?.companyName}様の課題を分析し、
              最適なエージェントチームと施策を検討しています
            </p>
            <div className="mt-6 space-y-2 text-sm text-text-secondary">
              <p className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
                経営戦略コンサルタントが課題を構造化中...
              </p>
              <p className="animate-fade-in" style={{ animationDelay: "1.5s" }}>
                専門エージェントをアサイン中...
              </p>
              <p className="animate-fade-in" style={{ animationDelay: "2.5s" }}>
                オーダーメイドの提案書を作成中...
              </p>
            </div>
          </div>
        </div>
      )}

      {step === "proposal" && projectCase && proposal && (
        <CaseProposalView
          projectCase={projectCase}
          proposal={proposal}
          onStartChat={handleStartChat}
        />
      )}

      {step === "chat" && projectCase && proposal && (
        <CaseChatView
          projectCase={projectCase}
          proposal={proposal}
        />
      )}
    </div>
  );
}
