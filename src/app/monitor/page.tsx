"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { useMachineStore } from "@/store/machines";
import { useAgentStore } from "@/store/agents";

interface ScreenSession {
  id: string;
  name: string;
  status: "Detached" | "Attached";
  created: string;
  attached: boolean;
}

export default function MonitorPage() {
  const [screenSessions, setScreenSessions] = useState<ScreenSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionOutput, setSessionOutput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(5);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const outputRef = useRef<HTMLDivElement>(null);
  
  const machines = useMachineStore((s) => s.machines);
  const agents = useAgentStore((s) => s.agents);

  const fetchScreenSessions = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Get list of all screen sessions from all machines
      const sessions: ScreenSession[] = [];
      
      for (const machine of machines.filter(m => m.status === "online")) {
        try {
          // Create temporary SSH session
          const sessionRes = await fetch(`/api/ssh/${machine.id}`, { method: "POST" });
          if (!sessionRes.ok) continue;
          const { sessionId } = await sessionRes.json();
          
          // Run screen -ls
          const execRes = await fetch(`/api/ssh/${sessionId}/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: "screen -ls" }),
          });
          
          const result = await execRes.json();
          const output = result.stdout || "";
          
          // Parse screen sessions
          const lines = output.split("\n").filter((l: string) => l.includes("detached") || l.includes("Attached"));
          
          for (const line of lines) {
            const match = line.match(/(\d+)\.(\S+).*\t(Detached|Attached)/);
            if (match) {
              sessions.push({
                id: `${machine.id}:${match[1]}`,
                name: match[2],
                status: match[3] as "Detached" | "Attached",
                created: machine.name,
                attached: match[3] === "Attached",
              });
            }
          }
          
          // Close session
          await fetch(`/api/ssh/${sessionId}/close`, { method: "DELETE" });
        } catch (e) {
          console.error(`Failed to fetch sessions from ${machine.name}:`, e);
        }
      }
      
      setScreenSessions(sessions);
    } catch (error) {
      console.error("Failed to fetch screen sessions:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [machines]);

  const fetchSessionOutput = useCallback(async (sessionId: string) => {
    const [machineId, screenPid] = sessionId.split(":");
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;
    
    try {
      // Create SSH session
      const sessionRes = await fetch(`/api/ssh/${machineId}`, { method: "POST" });
      if (!sessionRes.ok) return;
      const { sessionId: sshSessionId } = await sessionRes.json();
      
      // Get screen output using hardcopy
      const execRes = await fetch(`/api/ssh/${sshSessionId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: `screen -S ${screenPid} -X hardcopy /tmp/screen_hardcopy.txt && cat /tmp/screen_hardcopy.txt` }),
      });
      
      const result = await execRes.json();
      setSessionOutput(result.stdout || "(no output)");
      
      // Close session
      await fetch(`/api/ssh/${sshSessionId}/close`, { method: "DELETE" });
    } catch (error) {
      setSessionOutput(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [machines]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchScreenSessions();
      setIsLoading(false);
    };
    init();
  }, [fetchScreenSessions]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchScreenSessions();
      if (selectedSession) {
        fetchSessionOutput(selectedSession);
      }
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchScreenSessions, fetchSessionOutput, selectedSession]);

  // Scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [sessionOutput]);

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSession(sessionId);
    fetchSessionOutput(sessionId);
  };

  const handleStartAgent = async (agentName: string) => {
    const machine = machines[0]; // Default to first machine
    if (!machine) return;
    
    try {
      const res = await fetch(`/api/agents/spawn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: agentName, machineId: machine.id }),
      });
      
      if (res.ok) {
        await fetchScreenSessions();
      }
    } catch (error) {
      console.error("Failed to start agent:", error);
    }
  };

  const handleStopAgent = async (sessionId: string) => {
    const [machineId, screenPid] = sessionId.split(":");
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;
    
    try {
      // Create SSH session
      const sessionRes = await fetch(`/api/ssh/${machineId}`, { method: "POST" });
      if (!sessionRes.ok) return;
      const { sessionId: sshSessionId } = await sessionRes.json();
      
      // Kill screen session
      await fetch(`/api/ssh/${sshSessionId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: `screen -S ${screenPid} -X quit` }),
      });
      
      // Close session
      await fetch(`/api/ssh/${sshSessionId}/close`, { method: "DELETE" });
      
      // Refresh list
      await fetchScreenSessions();
    } catch (error) {
      console.error("Failed to stop agent:", error);
    }
  };

  const getAgentNameFromSession = (session: ScreenSession) => {
    // Try to match session name to known agents
    const agent = agents.find(a => 
      a.name.toLowerCase().includes(session.name.toLowerCase()) ||
      session.name.toLowerCase().includes(a.name.toLowerCase())
    );
    return agent?.name || session.name;
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <svg className="w-7 h-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Agent Live Monitor
          </h1>
          <p className="text-white/50 text-sm mt-1">Monitor and control running agents via screen sessions</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors",
                autoRefresh
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-white/5 text-white/50 border border-white/10"
              )}
            >
              Auto-refresh {autoRefresh ? "ON" : "OFF"}
            </button>
            
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-white text-sm outline-none"
              >
                <option value={3}>3s</option>
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={30}>30s</option>
              </select>
            )}
          </div>
          
          <button
            onClick={() => {
              fetchScreenSessions();
              if (selectedSession) fetchSessionOutput(selectedSession);
            }}
            disabled={isRefreshing}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-all flex items-center gap-2 text-sm"
          >
            <svg className={cn("w-4 h-4", isRefreshing && "animate-spin")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Session list */}
        <div className="w-80 border-r border-white/10 flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 bg-white/5">
            <h3 className="text-sm font-medium text-white">
              Screen Sessions ({screenSessions.length})
            </h3>
          </div>
          
          <div className="flex-1 overflow-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="w-6 h-6 animate-spin text-purple-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : screenSessions.length === 0 ? (
              <div className="text-center py-8 text-white/30">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No active sessions</p>
              </div>
            ) : (
              <div className="space-y-1">
                {screenSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSessionSelect(session.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      selectedSession === session.id
                        ? "bg-purple-500/20 border border-purple-500/30"
                        : "hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">
                        {getAgentNameFromSession(session)}
                      </span>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-xs",
                          session.status === "Attached"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        )}
                      >
                        {session.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                      <span className="font-mono">{session.name}</span>
                      <span>•</span>
                      <span>{session.created}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Quick actions */}
          <div className="p-4 border-t border-white/10 bg-white/5">
            <h4 className="text-xs text-white/40 mb-2">Quick Start Agent</h4>
            <div className="grid grid-cols-2 gap-1">
              {agents.slice(0, 4).map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleStartAgent(agent.name)}
                  className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white rounded transition-colors"
                >
                  {agent.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Session output */}
        <div className="flex-1 flex flex-col">
          {selectedSession ? (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">
                    {screenSessions.find(s => s.id === selectedSession)?.name}
                  </span>
                  <span className="text-xs text-white/40">
                    Live output
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchSessionOutput(selectedSession)}
                    className="p-2 text-white/40 hover:text-white transition-colors"
                    title="Refresh output"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleStopAgent(selectedSession)}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                  >
                    Stop
                  </button>
                </div>
              </div>
              
              <div
                ref={outputRef}
                className="flex-1 p-4 overflow-auto bg-black/50 font-mono text-sm"
              >
                <pre className="text-green-400 whitespace-pre-wrap">
                  {sessionOutput || "Loading..."}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-white/10 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-white/30">Select a session to view live output</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
