"use client";

import { useState, useEffect, useRef } from "react";
import { useMachineStore } from "@/store/machines";
import { Machine } from "@/types";

export default function TerminalPage({ params }: { params: Promise<{ id: string }> }) {
  const [machineId, setMachineId] = useState<string | null>(null);
  const [output, setOutput] = useState<{ type: string; text: string }[]>([]);
  const [command, setCommand] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  
  const machines = useMachineStore((s) => s.machines);

  useEffect(() => {
    params.then((p) => setMachineId(p.id));
  }, [params]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const machine = machines.find((m) => m.id === machineId);

  const handleConnect = () => {
    if (!machine) return;
    
    setIsConnected(true);
    setOutput([
      { type: "system", text: `Connecting to ${machine.name}...` },
      { type: "system", text: `ssh ${machine.ssh.user}@${machine.tailscaleIP}` },
      { type: "success", text: `Connected to ${machine.hostname}` },
      { type: "system", text: `Last login: ${new Date().toLocaleString()}` },
      { type: "system", text: "" },
    ]);
  };

  const handleExecute = async () => {
    if (!command.trim() || !isConnected) return;
    
    setOutput((prev) => [...prev, { type: "command", text: `$ ${command}` }]);
    setIsExecuting(true);
    
    // Simulate SSH execution
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const outputs: { type: string; text: string }[] = [];
    
    if (command.includes("ls")) {
      outputs.push({ type: "stdout", text: "Desktop  Documents  Downloads  Projects" });
    } else if (command.includes("pwd")) {
      outputs.push({ type: "stdout", text: `/Users/${machine?.ssh.user}` });
    } else if (command.includes("whoami")) {
      outputs.push({ type: "stdout", text: machine?.ssh.user || "ek" });
    } else if (command.includes("cd")) {
      outputs.push({ type: "system", text: "" });
    } else if (command.includes("npm run")) {
      outputs.push({ type: "stdout", text: "Compiling..." });
      outputs.push({ type: "stdout", text: "✓ Built successfully in 3.2s" });
    } else if (command.includes("git status")) {
      outputs.push({ type: "stdout", text: "On branch main" });
      outputs.push({ type: "stdout", text: "Your branch is up to date with 'origin/main'." });
      outputs.push({ type: "stdout", text: "nothing to commit, working tree clean" });
    } else if (command.includes("htop") || command.includes("top")) {
      outputs.push({ type: "stdout", text: "CPU: ████████░░ 78%" });
      outputs.push({ type: "stdout", text: "MEM: ████░░░░░░ 12GB/32GB" });
      outputs.push({ type: "stdout", text: "  PID  COMMAND     %CPU" });
      outputs.push({ type: "stdout", text: "1234  node        45.2" });
      outputs.push({ type: "stdout", text: "5678  claude      23.1" });
    } else {
      outputs.push({ type: "stdout", text: "" });
    }
    
    setOutput((prev) => [...prev, ...outputs]);
    setCommand("");
    setIsExecuting(false);
  };

  useEffect(() => {
    if (machine) {
      handleConnect();
    }
  }, [machine?.id]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-sm text-white/60">
            {machine ? `${machine.ssh.user}@${machine.hostname}` : "Terminal"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-xs ${isConnected ? "text-green-400" : "text-white/40"}`}>
            {isConnected ? "● Connected" : "○ Disconnected"}
          </span>
          <button
            onClick={() => setOutput([])}
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={outputRef}
        className="flex-1 p-4 font-mono text-sm overflow-auto bg-black/50"
      >
        {output.map((line, i) => (
          <div
            key={i}
            className={
              line.type === "stderr" || line.type === "error"
                ? "text-red-400"
                : line.type === "success"
                ? "text-green-400"
                : line.type === "command"
                ? "text-white"
                : line.type === "system"
                ? "text-blue-400"
                : "text-green-300"
            }
          >
            {line.text}
          </div>
        ))}
        {isExecuting && (
          <span className="animate-pulse">▋</span>
        )}
      </div>

      {/* Command Input */}
      <div className="border-t border-white/10 p-4 bg-white/5">
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/30 border border-white/10">
            <span className="text-green-400">$</span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleExecute()}
              placeholder={isConnected ? "Enter command..." : "Not connected"}
              disabled={!isConnected}
              className="flex-1 bg-transparent outline-none text-sm disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleExecute}
            disabled={!command.trim() || !isConnected || isExecuting}
            className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isExecuting ? "..." : "Run"}
          </button>
        </div>

        {/* Quick Commands */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs text-white/40">Quick:</span>
          {["ls -la", "pwd", "git status", "npm run dev", "htop"].map((cmd) => (
            <button
              key={cmd}
              onClick={() => setCommand(cmd)}
              disabled={!isConnected}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white disabled:opacity-30 transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
