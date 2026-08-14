"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { useMachineStore } from "@/store/machines";

interface Action {
  id: string;
  command: string;
  target: string;
  status: "pending" | "running" | "completed" | "failed";
  output: string;
  exitCode?: number;
  startedAt: Date;
  completedAt?: Date;
  machine?: string;
}

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [command, setCommand] = useState("");
  const [selectedMachine, setSelectedMachine] = useState<string>("all");
  const [isExecuting, setIsExecuting] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<string[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);
  
  const machines = useMachineStore((s) => s.machines);
  const onlineMachines = machines.filter((m) => m.status === "online");

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [sessionLogs]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSessionLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const idCounter = useRef(0);

  const executeCommand = async (cmd: string, target: string) => {
    const actionId = `action-${crypto.randomUUID()}-${++idCounter.current}`;

    setActions((prev) => [{
      id: actionId,
      command: cmd,
      target,
      status: "pending",
      output: "",
      startedAt: new Date(),
      machine: target,
    }, ...prev]);
    setIsExecuting(true);

    try {
      // Update status to running
      setActions((prev) =>
        prev.map((a) => (a.id === actionId ? { ...a, status: "running" } : a))
      );

      if (target === "all") {
        // Execute on all online machines
        addLog(`Executing on all ${onlineMachines.length} machines...`);
        
        const results = await Promise.allSettled(
          onlineMachines.map((m) =>
            fetch(`/api/ssh/${m.id}`, { method: "POST" })
              .then((r) => r.json())
              .then((session) =>
                fetch(`/api/ssh/${session.sessionId}/execute`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ command: cmd }),
                }).then((r) => r.json())
              )
              .finally(() =>
                fetch(`/api/ssh/${m.id}`, { method: "DELETE" }).catch(() => {})
              )
          )
        );

        let allSuccess = true;
        results.forEach((result, i) => {
          if (result.status === "fulfilled") {
            const data = result.value;
            setActions((prev) =>
              prev.map((a) =>
                a.id === actionId
                  ? {
                      ...a,
                      output: a.output + `\n[${onlineMachines[i].name}] ${data.stdout || data.stderr || ""}`,
                    }
                  : a
              )
            );
          } else {
            allSuccess = false;
            setActions((prev) =>
              prev.map((a) =>
                a.id === actionId
                  ? { ...a, output: a.output + `\n[${onlineMachines[i].name}] FAILED` }
                  : a
              )
            );
          }
        });

        setActions((prev) =>
          prev.map((a) =>
            a.id === actionId
              ? {
                  ...a,
                  status: allSuccess ? "completed" : "failed",
                  completedAt: new Date(),
                  exitCode: allSuccess ? 0 : 1,
                }
              : a
          )
        );

        addLog(allSuccess ? "All commands completed successfully" : "Some commands failed");
      } else {
        // Execute on single machine
        const machine = machines.find((m) => m.id === target);
        if (!machine) throw new Error("Machine not found");

        addLog(`Connecting to ${machine.name} (${machine.tailscaleIP})...`);

        // Create session
        const sessionRes = await fetch(`/api/ssh/${target}`, { method: "POST" });
        if (!sessionRes.ok) throw new Error("Failed to create SSH session");
        const { sessionId } = await sessionRes.json();

        // Execute command
        const execRes = await fetch(`/api/ssh/${sessionId}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: cmd }),
        });

        const result = await execRes.json();

        // Close session
        await fetch(`/api/ssh/${sessionId}/close`, { method: "DELETE" });

        setActions((prev) =>
          prev.map((a) =>
            a.id === actionId
              ? {
                  ...a,
                  status: execRes.ok ? "completed" : "failed",
                  output: result.stdout || result.stderr || "",
                  exitCode: result.exitCode,
                  completedAt: new Date(),
                }
              : a
          )
        );

        addLog(
          `Completed on ${machine.name} (exit: ${result.exitCode})`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setActions((prev) =>
        prev.map((a) =>
          a.id === actionId
            ? { ...a, status: "failed", output: message, completedAt: new Date() }
            : a
        )
      );
      addLog(`ERROR: ${message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    
    executeCommand(command, selectedMachine);
    setCommand("");
  };

  const handleQuickAction = (cmd: string) => {
    executeCommand(cmd, selectedMachine);
  };

  const quickActions = [
    { label: "Git Status", cmd: "git status" },
    { label: "Git Pull", cmd: "git pull" },
    { label: "Git Fetch", cmd: "git fetch --all" },
    { label: "List Processes", cmd: "ps aux | head -20" },
    { label: "Disk Usage", cmd: "df -h" },
    { label: "Memory", cmd: "free -h || vm_stat" },
    { label: "Uptime", cmd: "uptime" },
    { label: "Herdr Status", cmd: "herdr status" },
    { label: "Herdr List", cmd: "herdr list" },
    { label: "Screen List", cmd: "screen -ls" },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <svg className="w-7 h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Actions Terminal
        </h1>
        <p className="text-white/50 text-sm mt-1">Execute commands on remote machines via Herdr</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main terminal area */}
        <div className="flex-1 flex flex-col">
          {/* Command input */}
          <div className="p-4 border-b border-white/10 bg-white/5">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/50 border border-white/10">
                  <span className="text-purple-400 font-mono">$</span>
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter command..."
                    className="flex-1 bg-transparent outline-none text-white font-mono text-sm"
                    disabled={isExecuting}
                  />
                </div>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-purple-500"
                >
                  <option value="all">All Machines ({onlineMachines.length})</option>
                  {onlineMachines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!command.trim() || isExecuting}
                  className="px-6 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {isExecuting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Executing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Execute
                    </>
                  )}
                </button>
              </div>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-white/40 py-1">Quick:</span>
                {quickActions.map((qa) => (
                  <button
                    key={qa.cmd}
                    type="button"
                    onClick={() => handleQuickAction(qa.cmd)}
                    disabled={isExecuting}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white transition-colors disabled:opacity-30"
                    title={qa.cmd}
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Output */}
          <div className="flex-1 overflow-auto p-4">
            <h3 className="text-sm text-white/40 mb-3">Output</h3>
            <div className="space-y-4">
              {actions.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>No actions yet. Execute a command to see output here.</p>
                </div>
              ) : (
                actions.map((action) => (
                  <div
                    key={action.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      action.status === "running"
                        ? "bg-yellow-500/5 border-yellow-500/20"
                        : action.status === "completed"
                        ? "bg-green-500/5 border-green-500/20"
                        : action.status === "failed"
                        ? "bg-red-500/5 border-red-500/20"
                        : "bg-white/5 border-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <code className="text-sm text-white font-mono">{action.command}</code>
                        {action.machine && (
                          <span className="text-xs text-white/40">
                            → {action.machine}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-xs",
                            action.status === "running"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : action.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : action.status === "failed"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-white/10 text-white/40"
                          )}
                        >
                          {action.status}
                        </span>
                        {action.exitCode !== undefined && (
                          <span className="text-xs text-white/40">
                            exit: {action.exitCode}
                          </span>
                        )}
                      </div>
                    </div>
                    {action.output && (
                      <pre className="mt-2 p-3 bg-black/30 rounded text-sm text-white/70 font-mono whitespace-pre-wrap overflow-auto max-h-60">
                        {action.output}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Session log sidebar */}
        <div className="w-80 border-l border-white/10 flex flex-col bg-black/30">
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-medium text-white">Session Log</h3>
          </div>
          <div
            ref={logsRef}
            className="flex-1 overflow-auto p-4 font-mono text-xs text-white/50 space-y-1"
          >
            {sessionLogs.length === 0 ? (
              <p className="text-white/30">No logs yet</p>
            ) : (
              sessionLogs.map((log, i) => (
                <div key={i} className="break-all">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
