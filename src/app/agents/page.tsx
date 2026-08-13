"use client";

import { useAgentStore } from "@/store/agents";

const divisionColors: Record<string, string> = {
  engineering: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  creative: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
  operations: "from-green-500/20 to-green-600/10 border-green-500/30",
  learning: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
};

const modelColors: Record<string, string> = {
  "opus-5": "bg-purple-500/20 text-purple-300",
  "sonnet-5": "bg-blue-500/20 text-blue-300",
  "fable-5": "bg-pink-500/20 text-pink-300",
  "codex": "bg-green-500/20 text-green-300",
  "haiku-5": "bg-yellow-500/20 text-yellow-300",
};

export default function AgentsPage() {
  const agents = useAgentStore((s) => s.agents);

  const divisions = ["engineering", "creative", "operations", "learning"] as const;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Team</h1>
          <p className="text-white/50 mt-1">
            {agents.filter((a) => a.status === "active").length} active agents
          </p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium">
          + Spawn Agent
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm">
          <option>All Divisions</option>
          {divisions.map((d) => (
            <option key={d} value={d} className="capitalize">
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>
        <select className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm">
          <option>All Models</option>
          <option value="opus-5">Opus 5</option>
          <option value="sonnet-5">Sonnet 5</option>
          <option value="fable-5">Fable 5</option>
          <option value="codex">Codex</option>
          <option value="haiku-5">Haiku 5</option>
        </select>
        <select className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm">
          <option>All Status</option>
          <option value="active">Active</option>
          <option value="idle">Idle</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {/* Agent Grid by Division */}
      <div className="space-y-8">
        {divisions.map((division) => {
          const divisionAgents = agents.filter((a) => a.division === division);
          if (divisionAgents.length === 0) return null;

          return (
            <section key={division}>
              <div className="flex items-center gap-3 mb-4">
                <DivisionIcon division={division} />
                <h2 className="text-lg font-semibold capitalize">{division} Division</h2>
                <span className="text-sm text-white/40">
                  {divisionAgents.filter((a) => a.status === "active").length} active
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {divisionAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: ReturnType<typeof useAgentStore.getState>["agents"][0] }) {
  return (
    <div
      className={`p-5 rounded-xl border bg-gradient-to-br ${divisionColors[agent.division]} transition-all hover:scale-[1.02]`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-sm font-bold">{agent.name.replace("ek-", "").slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <h3 className="font-medium">{agent.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded ${modelColors[agent.model]}`}>
              {agent.model}
            </span>
          </div>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      {agent.currentTask && (
        <div className="mb-4">
          <p className="text-xs text-white/50 mb-1">Current Task</p>
          <p className="text-sm truncate">{agent.currentTask}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {agent.skills.map((skill) => (
          <span
            key={skill}
            className="px-2 py-0.5 rounded bg-white/10 text-xs text-white/60"
          >
            {skill}
          </span>
        ))}
      </div>

      {agent.machineId && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/40">
            Running on: <span className="text-white/60">{agent.machineId}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    idle: "bg-yellow-500/20 text-yellow-400",
    offline: "bg-red-500/20 text-red-400",
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || ""}`}>
      {status}
    </span>
  );
}

function DivisionIcon({ division }: { division: string }) {
  const icons: Record<string, React.ReactNode> = {
    engineering: <CodeIcon />,
    creative: <PaletteIcon />,
    operations: <CogIcon />,
    learning: <BrainIcon />,
  };

  return (
    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
      {icons[division]}
    </div>
  );
}

function CodeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  );
}
