import { create } from "zustand";
import { Project, Task } from "@/types";
import { defaultProjects } from "@/lib/projects/data";

interface ProjectStore {
  projects: Project[];
  tasks: Task[];
  
  // Actions
  setProjects: (projects: Project[]) => void;
  updateProjectProgress: (id: string, progress: number) => void;
  updateProjectStatus: (id: string, status: Project["status"]) => void;
  getProject: (id: string) => Project | undefined;
  
  // Tasks
  addTask: (task: Task) => void;
  updateTaskStatus: (id: string, status: Task["status"]) => void;
  getTasksByProject: (projectId: string) => Task[];
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: defaultProjects,
  tasks: [],

  setProjects: (projects) => set({ projects }),

  updateProjectProgress: (id, progress) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, progress } : p
      ),
    })),

  updateProjectStatus: (id, status) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, status } : p
      ),
    })),

  getProject: (id) => get().projects.find((p) => p.id === id),

  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),

  updateTaskStatus: (id, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status, updatedAt: new Date() } : t
      ),
    })),

  getTasksByProject: (projectId) =>
    get().tasks.filter((t) => t.projectId === projectId),
}));
