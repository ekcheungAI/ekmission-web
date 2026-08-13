import { create } from "zustand";
import { Agent } from "@/types";
import { defaultAgents } from "@/lib/agents/data";

interface AgentStore {
  agents: Agent[];
  
  // Actions
  setAgents: (agents: Agent[]) => void;
  updateAgentStatus: (id: string, status: Agent["status"]) => void;
  updateAgentTask: (id: string, task: string | undefined) => void;
  getAgent: (id: string) => Agent | undefined;
  getAgentsByDivision: (division: Agent["division"]) => Agent[];
  getActiveAgents: () => Agent[];
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: defaultAgents,

  setAgents: (agents) => set({ agents }),

  updateAgentStatus: (id, status) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === id ? { ...a, status, lastSeen: new Date() } : a
      ),
    })),

  updateAgentTask: (id, task) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === id ? { ...a, currentTask: task } : a
      ),
    })),

  getAgent: (id) => get().agents.find((a) => a.id === id),

  getAgentsByDivision: (division) =>
    get().agents.filter((a) => a.division === division),

  getActiveAgents: () => get().agents.filter((a) => a.status === "active"),
}));
