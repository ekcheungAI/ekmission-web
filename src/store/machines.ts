import { create } from "zustand";
import { Machine, CommandExecution } from "@/types";
import { defaultMachines } from "@/lib/machines/data";

interface MachineStore {
  machines: Machine[];
  executions: CommandExecution[];
  activeExecution: CommandExecution | null;
  
  // Actions
  setMachines: (machines: Machine[]) => void;
  updateMachineStatus: (id: string, status: Machine["status"]) => void;
  addExecution: (execution: CommandExecution) => void;
  updateExecution: (id: string, updates: Partial<CommandExecution>) => void;
  setActiveExecution: (execution: CommandExecution | null) => void;
  getMachine: (id: string) => Machine | undefined;
}

export const useMachineStore = create<MachineStore>((set, get) => ({
  machines: defaultMachines,
  executions: [],
  activeExecution: null,

  setMachines: (machines) => set({ machines }),

  updateMachineStatus: (id, status) =>
    set((state) => ({
      machines: state.machines.map((m) =>
        m.id === id ? { ...m, status, lastSeen: new Date() } : m
      ),
    })),

  addExecution: (execution) =>
    set((state) => ({
      executions: [execution, ...state.executions].slice(0, 100),
    })),

  updateExecution: (id, updates) =>
    set((state) => ({
      executions: state.executions.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
      activeExecution:
        state.activeExecution?.id === id
          ? { ...state.activeExecution, ...updates }
          : state.activeExecution,
    })),

  setActiveExecution: (execution) => set({ activeExecution: execution }),

  getMachine: (id) => get().machines.find((m) => m.id === id),
}));
