"use client";

import { useState } from "react";
import { useProjectStore } from "@/store/projects";

const mockTasks: Array<{
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo?: string;
  status: "pending" | "in-progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high";
  createdAt: Date;
  updatedAt: Date;
}> = [
  {
    id: "1",
    title: "Implement OAuth 2.0 login",
    description: "Add Google and GitHub OAuth providers",
    projectId: "heyommi",
    assignedTo: "ek-dev",
    status: "in-progress",
    priority: "high",
    createdAt: new Date("2026-08-10"),
    updatedAt: new Date("2026-08-12"),
  },
  {
    id: "2",
    title: "Design login page UI",
    description: "Create responsive login form with OAuth buttons",
    projectId: "heyommi",
    assignedTo: "ek-ui",
    status: "in-progress",
    priority: "high",
    createdAt: new Date("2026-08-10"),
    updatedAt: new Date("2026-08-11"),
  },
  {
    id: "3",
    title: "Set up database migrations",
    description: "Create users and sessions tables",
    projectId: "askclaw",
    status: "completed",
    priority: "medium",
    createdAt: new Date("2026-08-08"),
    updatedAt: new Date("2026-08-10"),
  },
  {
    id: "4",
    title: "Create brand guidelines",
    description: "Define colors, typography, and voice",
    projectId: "homedaddy",
    status: "pending",
    priority: "low",
    createdAt: new Date("2026-08-05"),
    updatedAt: new Date("2026-08-05"),
  },
];

export default function TasksPage() {
  const projects = useProjectStore((s) => s.projects);
  const [filter, setFilter] = useState<"all" | "pending" | "in-progress" | "completed">("all");

  const tasks = mockTasks;
  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-white/50 mt-1">
            {tasks.filter((t) => t.status === "in-progress").length} in progress
          </p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium">
          + New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "pending", "in-progress", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-purple-500 text-white"
                : "bg-white/5 hover:bg-white/10 text-white/60"
            }`}
          >
            {f === "all" ? "All" : f === "in-progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const project = projects.find((p) => p.id === task.projectId);
          return (
            <div
              key={task.id}
              className="p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium">{task.title}</h3>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <p className="text-sm text-white/50">{task.description}</p>
                </div>
                <TaskStatusBadge status={task.status} />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-white/40">
                    Project: <span className="text-white/60">{project?.name}</span>
                  </span>
                  {task.assignedTo && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-xs font-bold">
                          {task.assignedTo.replace("ek-", "").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-white/60">{task.assignedTo}</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-white/40">
                  Updated {new Date(task.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
          <div className="text-2xl font-bold">{tasks.length}</div>
          <div className="text-sm text-white/50">Total</div>
        </div>
        <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
          <div className="text-2xl font-bold text-green-400">
            {tasks.filter((t) => t.status === "completed").length}
          </div>
          <div className="text-sm text-white/50">Completed</div>
        </div>
        <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {tasks.filter((t) => t.status === "in-progress").length}
          </div>
          <div className="text-sm text-white/50">In Progress</div>
        </div>
        <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
          <div className="text-2xl font-bold text-white/40">
            {tasks.filter((t) => t.status === "pending").length}
          </div>
          <div className="text-sm text-white/50">Pending</div>
        </div>
      </div>
    </div>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-white/10 text-white/60",
    "in-progress": "bg-yellow-500/20 text-yellow-400",
    completed: "bg-green-500/20 text-green-400",
    blocked: "bg-red-500/20 text-red-400",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || ""}`}>
      {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    high: "bg-red-500/20 text-red-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    low: "bg-blue-500/20 text-blue-400",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority] || ""}`}>
      {priority}
    </span>
  );
}
