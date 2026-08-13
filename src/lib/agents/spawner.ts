import { Machine, CommandExecution } from "@/types";

export interface SpawnConfig {
  name: string;
  model: "opus-5" | "sonnet-5" | "fable-5" | "codex" | "haiku-5";
  skill: string;
  task?: string;
}

export interface SpawnResult {
  success: boolean;
  sessionId: string;
  machineId: string;
  command: string;
  message: string;
}

export async function spawnAgentOnMachine(
  machine: Machine,
  config: SpawnConfig
): Promise<SpawnResult> {
  const { name, model, skill, task } = config;

  // Build the spawn command
  const baseCommand = `cd ~/Desktop/ekOS/03_agents && screen -dmS ek-${name}`;
  
  let agentCommand = `bash -c '`;
  agentCommand += `export AGENT_MODEL=${model} && `;
  agentCommand += `export AGENT_SKILL=${skill} && `;
  if (task) {
    agentCommand += `export AGENT_TASK="${task}" && `;
  }
  agentCommand += `ek-${name} --spawn`;
  agentCommand += `'`;

  const fullCommand = `${baseCommand} ${agentCommand}`;

  // In production, this would use the SSH executor
  // For now, return the command structure
  return {
    success: true,
    sessionId: `session-${Date.now()}`,
    machineId: machine.id,
    command: fullCommand,
    message: `Agent ${name} spawning on ${machine.name} (${machine.tailscaleIP})`,
  };
}

export function buildSpawnCommand(config: SpawnConfig): string {
  const { name, model, skill, task } = config;

  const modelArg = model ? `--model ${model}` : "";
  const skillArg = skill ? `--skill ${skill}` : "";
  const taskArg = task ? `--task "${task}"` : "";

  return `ek-${name} spawn ${modelArg} ${skillArg} ${taskArg}`.trim();
}

export function selectMachineForTask(
  machines: Machine[],
  taskType: "build" | "dev" | "deploy" | "all"
): Machine | null {
  const available = machines.filter(
    (m) => m.status === "online" && m.capabilities.includes(taskType)
  );

  if (available.length === 0) {
    // Fallback to machines with "all" capability
    const allCapable = machines.filter(
      (m) => m.status === "online" && m.capabilities.includes("all")
    );
    return allCapable[0] || null;
  }

  // Return least busy machine
  return available.sort((a, b) => a.currentAgents.length - b.currentAgents.length)[0];
}
