import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, skill, task, machineId, command, agentName } = body;

    // Build the spawn command
    let spawnCommand = "";
    
    if (command) {
      // Direct command execution
      spawnCommand = command;
    } else {
      // Agent spawn command
      const modelArg = model ? `--model ${model}` : "";
      const skillArg = skill ? `--skill ${skill}` : "";
      const taskArg = task ? `--task "${task}"` : "";
      const name = agentName || "dev";
      
      spawnCommand = `cd ~/Desktop/ekOS && ek-${name} spawn ${modelArg} ${skillArg} ${taskArg}`.trim();
    }

    return NextResponse.json({
      success: true,
      agent: {
        name: agentName || "dev",
        model,
        skill,
        task,
        machineId,
        status: "spawning",
      },
      spawnCommand,
      sshCommand: machineId 
        ? `ssh ek@<tailscale-ip> '${spawnCommand}'`
        : spawnCommand,
      message: `Agent ${agentName || "dev"} is being spawned${machineId ? ` on machine ${machineId}` : ""}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
