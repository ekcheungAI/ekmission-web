import { NextResponse } from "next/server";
import { executeSSHSession } from "@/lib/ssh/sessions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const { command } = body;

    if (!command) {
      return NextResponse.json(
        { error: "Command is required" },
        { status: 400 }
      );
    }

    const result = await executeSSHSession(sessionId, command);

    return NextResponse.json(result);
  } catch (error) {
    console.error("SSH command execution failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Command execution failed" },
      { status: 500 }
    );
  }
}
