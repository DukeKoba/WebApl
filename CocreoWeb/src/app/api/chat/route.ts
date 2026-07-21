import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, agentId } = body;

  // In production, this would call the Claude API
  // For MVP, return a structured response
  return NextResponse.json({
    success: true,
    agentId,
    message: `${agentId}エージェントが「${message}」について分析中です。`,
    timestamp: new Date().toISOString(),
  });
}
