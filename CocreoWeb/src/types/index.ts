export interface Agent {
  id: string;
  name: string;
  role: string;
  specialty: string;
  description: string;
  icon: string;
  color: string;
  capabilities: string[];
}

export interface Message {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: Date;
  type: "agent" | "user" | "system";
}

export interface ConsultingSession {
  id: string;
  companyName: string;
  industry: string;
  region: string;
  employeeCount: number;
  challenges: string[];
  activeAgents: string[];
  messages: Message[];
  createdAt: Date;
  status: "active" | "completed" | "pending";
}

export interface DiagnosisResult {
  category: string;
  score: number;
  maxScore: number;
  findings: string[];
  recommendations: string[];
}

export interface CompanyProfile {
  name: string;
  industry: string;
  region: string;
  prefecture: string;
  employeeCount: number;
  annualRevenue?: string;
  foundedYear?: number;
  challenges: string[];
  goals: string[];
}
