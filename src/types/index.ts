export type MachineStatus = "online" | "offline" | "busy";

export interface Machine {
  id: string;
  name: string;
  hostname: string;
  tailscaleIP: string;
  description: string;
  ssh: {
    user: string;
    keyPath: string;
    port: number;
  };
  capabilities: ("build" | "dev" | "deploy" | "all")[];
  location: string;
  specs: {
    cpu: string;
    ram: string;
    disk: string;
  };
  currentAgents: string[];
  status: MachineStatus;
  lastSeen?: Date;
}

export interface CommandExecution {
  id: string;
  machineId: string;
  command: string;
  cwd?: string;
  status: "pending" | "running" | "completed" | "failed";
  stdout: string;
  stderr: string;
  exitCode?: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  division: "creative" | "engineering" | "operations" | "learning";
  model: "opus-5" | "sonnet-5" | "fable-5" | "codex" | "haiku-5";
  status: "active" | "idle" | "offline";
  currentTask?: string;
  machineId?: string;
  lastSeen?: Date;
  skills: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: "active" | "queued" | "completed";
  activeAgents: string[];
  repo?: string;
  url?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo?: string;
  status: "pending" | "in-progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high";
  createdAt: Date;
  updatedAt: Date;
}
