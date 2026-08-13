"use client";

import { useState } from "react";
import { useMachineStore } from "@/store/machines";
import { Machine } from "@/types";

export default function MachinesPage() {
  const machines = useMachineStore((s) => s.machines);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState<{ type: "stdout" | "stderr"; text: string }[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    if (!selectedMachine || !command.trim()) return;
    
    setIsExecuting(true);
    setOutput([]);
    
    // Simulate SSH execution (replace with actual SSH call)
    setOutput([
      { type: "stdout", text: `$ ssh ${selectedMachine.ssh.user}@${selectedMachine.tailscaleIP}` },
      { type: "stdout", text: `Connected to ${selectedMachine.name}` },
      { type: "stdout", text: `$ ${command}` },
    ]);
    
    // Simulate output
    setTimeout(() => {
      setOutput((prev) => [
        ...prev,
        { type: "stdout", text: "Building project..." },
        { type: "stdout", text: "✓ Compiled successfully in 12s" },
        { type: "stdout", text: "✓ Route (client)" },
        { type: "stdout", text: "  └─ ○ /" },
        { type: "stdout", text: "✓ Deploying to Vercel..." },
        { type: "stdout", text: "✓ Deployed! https://heyommi.vercel.app" },
      ]);
      setIsExecuting(false);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Remote Machines</h1>
          <p className="text-white/50 mt-1">Manage your Mac Minis and execute commands</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium">
          + Add Machine
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine List */}
        <div className="lg:col-span-1 space-y-4">
          {machines.map((machine) => (
            <button
              key={machine.id}
              onClick={() => {
                setSelectedMachine(machine);
                setOutput([]);
              }}
              className={`w-full p-5 rounded-xl border text-left transition-all ${
                selectedMachine?.id === machine.id
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">{machine.name}</h3>
                <StatusIndicator status={machine.status} />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-white/50">
                  <TerminalIcon className="w-4 h-4" />
                  <span>{machine.tailscaleIP}</span>
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <CpuIcon className="w-4 h-4" />
                  <span>{machine.specs.cpu} · {machine.specs.ram}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {machine.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded bg-white/10 text-xs text-white/60"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Command Execution Panel */}
        <div className="lg:col-span-2">
          {selectedMachine ? (
            <div className="h-full flex flex-col rounded-xl border border-white/10 bg-black/30 overflow-hidden">
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-sm text-white/60">
                    {selectedMachine.ssh.user}@{selectedMachine.hostname}
                  </span>
                </div>
                <button className="text-xs text-white/40 hover:text-white">
                  Copy Output
                </button>
              </div>

              {/* Terminal Output */}
              <div className="flex-1 p-4 font-mono text-sm overflow-auto min-h-[300px]">
                {output.length === 0 ? (
                  <div className="text-white/40">
                    <p>Connected to {selectedMachine.name}</p>
                    <p className="text-white/20 mt-2">Ready to execute commands...</p>
                  </div>
                ) : (
                  output.map((line, i) => (
                    <div
                      key={i}
                      className={line.type === "stderr" ? "text-red-400" : "text-green-400"}
                    >
                      {line.text}
                    </div>
                  ))
                )}
                {isExecuting && (
                  <div className="text-white/40 animate-pulse">Executing...</div>
                )}
              </div>

              {/* Command Input */}
              <div className="border-t border-white/10 p-4">
                <div className="flex gap-3">
                  <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-green-400">$</span>
                    <input
                      type="text"
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleExecute()}
                      placeholder="Enter command..."
                      className="flex-1 bg-transparent outline-none text-sm"
                    />
                  </div>
                  <button
                    onClick={handleExecute}
                    disabled={!command.trim() || isExecuting}
                    className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {isExecuting ? "Running..." : "Execute"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <div className="text-center">
                <TerminalIcon className="w-12 h-12 mx-auto text-white/20 mb-4" />
                <p className="text-white/40">Select a machine to execute commands</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusIndicator({ status }: { status: Machine["status"] }) {
  const colors: Record<string, string> = {
    online: "bg-green-500",
    offline: "bg-red-500",
    busy: "bg-yellow-500",
  };

  return (
    <span className={`w-2.5 h-2.5 rounded-full ${colors[status] || "bg-white/20"}`} />
  );
}

function TerminalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function CpuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
    </svg>
  );
}
