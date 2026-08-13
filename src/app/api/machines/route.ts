import { NextRequest, NextResponse } from "next/server";
import { defaultMachines } from "@/lib/machines/data";

export async function GET() {
  return NextResponse.json({
    machines: defaultMachines,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tailscaleIP, name, capabilities } = body;

    if (!tailscaleIP || !name) {
      return NextResponse.json(
        { error: "Missing required fields: tailscaleIP, name" },
        { status: 400 }
      );
    }

    const newMachine = {
      id: `machine-${Date.now()}`,
      name,
      tailscaleIP,
      capabilities: capabilities || ["all"],
      status: "offline" as const,
      currentAgents: [],
      description: "",
      hostname: tailscaleIP,
      ssh: {
        user: "ek",
        keyPath: "~/.ssh/id_ed25519",
        port: 22,
      },
      location: "Unknown",
      specs: {
        cpu: "Unknown",
        ram: "Unknown",
        disk: "Unknown",
      },
    };

    return NextResponse.json({ machine: newMachine }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
