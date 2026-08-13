import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;
  
  try {
    const body = await request.json();
    const { model, skill, task, machineId } = body;

    if (!model || !skill) {
      return NextResponse.json(
        { error: "Missing required fields: model, skill" },
        { status: 400 }
      );
    }

    // In production, this would spawn the agent via SSH
    const sessionId = `session-${Date.now()}`;
    
    return NextResponse.json({
      success: true,
      sessionId,
      agent: {
        name,
        model,
        skill,
        task,
        machineId,
        status: "spawning",
      },
      message: `Agent ${name} spawning on ${machineId || "local"} with model ${model}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
