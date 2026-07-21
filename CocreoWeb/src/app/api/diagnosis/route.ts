import { NextRequest, NextResponse } from "next/server";
import { calculateDiagnosis } from "@/lib/diagnosis";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { answers } = body;

  const results = calculateDiagnosis(answers);

  return NextResponse.json({
    success: true,
    results,
    timestamp: new Date().toISOString(),
  });
}
