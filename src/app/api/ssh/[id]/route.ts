import { NextResponse } from "next/server";
import { createSSHSession } from "@/lib/ssh/sessions";
import { defaultMachines } from "@/lib/machines/data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const machine = defaultMachines.find((m) => m.id === id);

    if (!machine) {
      return NextResponse.json(
        { error: "Machine not found" },
        { status: 404 }
      );
    }

    const sessionId = await createSSHSession(machine);

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error("SSH session creation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create SSH session" },
      { status: 500 }
    );
  }
}
