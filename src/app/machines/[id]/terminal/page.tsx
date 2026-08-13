"use client";

import { useState, useEffect } from "react";
import { useMachineStore } from "@/store/machines";
import SSHTerminal from "@/components/terminal/ssh-terminal";
import Link from "next/link";

export default function TerminalPage({ params }: { params: Promise<{ id: string }> }) {
  const [machineId, setMachineId] = useState<string | null>(null);
  const machines = useMachineStore((s) => s.machines);

  useEffect(() => {
    params.then((p) => setMachineId(p.id));
  }, [params]);

  const machine = machines.find((m) => m.id === machineId);

  if (!machine) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Machine Not Found</h2>
          <p className="text-white/50 mb-4">The requested machine could not be found.</p>
          <Link 
            href="/machines"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back to Machines
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Machine info bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-4">
          <Link 
            href="/machines"
            className="text-white/40 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div>
            <h1 className="text-sm font-medium text-white">{machine.name}</h1>
            <p className="text-xs text-white/40">{machine.tailscaleIP}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded text-xs ${
            machine.status === "online" 
              ? "bg-green-500/20 text-green-400" 
              : "bg-red-500/20 text-red-400"
          }`}>
            {machine.status}
          </span>
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 overflow-hidden">
        <SSHTerminal 
          machine={machine}
          onClose={() => window.history.back()}
        />
      </div>
    </div>
  );
}
