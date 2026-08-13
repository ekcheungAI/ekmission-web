import { NextResponse } from "next/server";
import { closeSSHSession } from "@/lib/ssh/sessions";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    await closeSSHSession(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SSH session close failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to close session" },
      { status: 500 }
    );
  }
}
