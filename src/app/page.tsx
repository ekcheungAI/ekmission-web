"use client";

import { useAgentStore } from "@/store/agents";
import { useMachineStore } from "@/store/machines";
import { useProjectStore } from "@/store/projects";

export default function DashboardPage() {
  const agents = useAgentStore((s) => s.agents);
  const machines = useMachineStore((s) => s.machines);
  const projects = useProjectStore((s) => s.projects);

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const onlineMachines = machines.filter((m) => m.status !== "offline").length;
  const activeProjects = projects.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-white/50 mt-1">Welcome to ekmission command center</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Active Agents"
          value={activeAgents}
          total={agents.length}
          icon={<BotIcon />}
          color="purple"
        />
        <StatCard
          label="Running Tasks"
          value={activeAgents}
          icon={<PlayIcon />}
          color="green"
        />
        <StatCard
          label="Remote Machines"
          value={onlineMachines}
          total={machines.length}
          icon={<ServerIcon />}
          color="blue"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-4">Active Projects</h2>
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-white/50">{project.description}</p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
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
                  {project.activeAgents.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-white/50">Agents:</span>
                      {project.activeAgents.map((agentId) => (
                        <span
                          key={agentId}
                          className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs"
                        >
                          {agentId}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Active Agents */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Active Agents</h2>
            <div className="space-y-3">
              {agents
                .filter((a) => a.status === "active")
                .slice(0, 5)
                .map((agent) => (
                  <div
                    key={agent.id}
                    className="p-4 rounded-lg border border-white/10 bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-xs font-bold">{agent.name.slice(0, 2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{agent.name}</p>
                        <p className="text-xs text-white/50 truncate">
                          {agent.currentTask || "Idle"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>

          {/* Machines Status */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Machines</h2>
            <div className="space-y-3">
              {machines.map((machine) => (
                <div
                  key={machine.id}
                  className="p-4 rounded-lg border border-white/10 bg-white/5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{machine.name}</p>
                      <p className="text-xs text-white/50">{machine.tailscaleIP}</p>
                    </div>
                    <MachineStatus status={machine.status} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  total,
  icon,
  color,
}: {
  label: string;
  value: number;
  total?: number;
  icon: React.ReactNode;
  color: "purple" | "green" | "blue";
}) {
  const colors = {
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    green: "from-green-500/20 to-green-600/10 border-green-500/30",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  };

  return (
    <div
      className={`p-6 rounded-xl border bg-gradient-to-br ${colors[color]} backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-white/60">{label}</span>
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold">
        {value}
        {total !== undefined && (
          <span className="text-lg text-white/40">/{total}</span>
        )}
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

function MachineStatus({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: "bg-green-500",
    offline: "bg-red-500",
    busy: "bg-yellow-500",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${colors[status] || "bg-white/20"}`} />
      <span className="text-xs text-white/60 capitalize">{status}</span>
    </div>
  );
}

// Icons
function BotIcon() {
  return (
    <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  );
}
