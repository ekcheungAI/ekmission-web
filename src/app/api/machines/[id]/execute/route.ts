import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  try {
    const body = await request.json();
    const { command, cwd } = body;

    if (!command) {
      return NextResponse.json(
        { error: "Command is required" },
        { status: 400 }
      );
    }

    // In production, this would execute the SSH command
    // For now, simulate execution
    const executionId = `exec-${Date.now()}`;
    
    // Simulate some output
    const outputs = [
      { type: "stdout", text: `$ ssh ek@100.84.123.x` },
      { type: "stdout", text: `Connected to machine: ${id}` },
      { type: "stdout", text: `$ ${command}` },
      { type: "stdout", text: "Executing command..." },
    ];

    return NextResponse.json({
      executionId,
      machineId: id,
      command,
      cwd: cwd || "~",
      status: "running",
      outputs,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
