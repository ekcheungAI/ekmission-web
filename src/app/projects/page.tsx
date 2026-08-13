"use client";

import { useProjectStore } from "@/store/projects";
import Link from "next/link";

export default function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-white/50 mt-1">
            {projects.filter((p) => p.status === "active").length} active projects
          </p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium">
          + New Project
        </button>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group block"
          >
            <div className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:border-purple-500/50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold group-hover:text-purple-400 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-white/50 mt-1">{project.description}</p>
                </div>
                <StatusBadge status={project.status} />
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/50">Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  {project.activeAgents.length > 0 ? (
                    project.activeAgents.slice(0, 3).map((agentId, i) => (
                      <div
                        key={agentId}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center -ml-2 first:ml-0"
                        style={{ zIndex: 3 - i }}
                      >
                        <span className="text-xs font-bold">
                          {agentId.replace("ek-", "").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-white/40">No active agents</span>
                  )}
                  {project.activeAgents.length > 3 && (
                    <span className="text-xs text-white/40 ml-1">
                      +{project.activeAgents.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {project.url && (
                    <span className="text-xs text-white/40 hover:text-white transition-colors">
                      {project.url.replace("https://", "")}
                    </span>
                  )}
                  <span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
          <div className="text-2xl font-bold text-green-400">
            {projects.filter((p) => p.status === "active").length}
          </div>
          <div className="text-sm text-white/50">Active</div>
        </div>
        <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {projects.filter((p) => p.status === "queued").length}
          </div>
          <div className="text-sm text-white/50">Queued</div>
        </div>
        <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {projects.filter((p) => p.status === "completed").length}
          </div>
          <div className="text-sm text-white/50">Completed</div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    queued: "bg-yellow-500/20 text-yellow-400",
    completed: "bg-blue-500/20 text-blue-400",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-white/10"}`}
    >
      {status}
    </span>
  );
}
