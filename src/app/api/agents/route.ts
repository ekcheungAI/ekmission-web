import { NextRequest, NextResponse } from "next/server";
import { defaultAgents } from "@/lib/agents/data";

export async function GET() {
  return NextResponse.json({
    agents: defaultAgents,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, division, model, skills, machineId } = body;

    if (!name || !division || !model) {
      return NextResponse.json(
        { error: "Missing required fields: name, division, model" },
        { status: 400 }
      );
    }

    const newAgent = {
      id: name,
      name,
      division,
      model,
      status: "idle" as const,
      skills: skills || [],
      machineId,
    };

    return NextResponse.json({ agent: newAgent }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
