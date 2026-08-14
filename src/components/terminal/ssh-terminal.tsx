"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { cn } from "@/lib/utils";
import { Machine } from "@/types";

interface SSHTerminalProps {
  machine: Machine;
  className?: string;
  onClose?: () => void;
}

export default function SSHTerminal({ machine, className, onClose }: SSHTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const currentLineRef = useRef("");

  // Initialize xterm
  useEffect(() => {
    if (!terminalRef.current) return;

    const xterm = new XTerm({
      theme: {
        background: "#0a0a0f",
        foreground: "#e4e4e7",
        cursor: "#a78bfa",
        cursorAccent: "#0a0a0f",
        selectionBackground: "rgba(139, 92, 246, 0.3)",
        black: "#18181b",
        red: "#ef4444",
        green: "#22c55e",
        yellow: "#eab308",
        blue: "#3b82f6",
        magenta: "#a78bfa",
        cyan: "#06b6d4",
        white: "#e4e4e7",
        brightBlack: "#3f3f46",
        brightRed: "#f87171",
        brightGreen: "#4ade80",
        brightYellow: "#facc15",
        brightBlue: "#60a5fa",
        brightMagenta: "#c084fc",
        brightCyan: "#22d3ee",
        brightWhite: "#fafafa",
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
      fontSize: 14,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: "bar",
      allowTransparency: true,
      scrollback: 10000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);

    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Handle resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      xterm.dispose();
    };
  }, []);

  const writePrompt = useCallback((xterm: XTerm) => {
    xterm.write(`\x1b[1;36m${machine.ssh.user}\x1b[0m@\x1b[1;35m${machine.name}\x1b[0m:\x1b[1;34m~\x1b[0m$ `);
  }, [machine.ssh.user, machine.name]);

  const executeCommand = useCallback(async (command: string, xterm: XTerm) => {
    // Built-in commands
    if (command === "clear" || command === "cls") {
      xterm.clear();
      writePrompt(xterm);
      return;
    }

    if (command === "exit" || command === "logout") {
      xterm.writeln("\x1b[90mClosing session...\x1b[0m");
      if (sessionId) {
        await fetch(`/api/ssh/${sessionId}/close`, { method: "DELETE" });
      }
      onClose?.();
      return;
    }

    try {
      const res = await fetch(`/api/ssh/${sessionId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });

      if (!res.ok) {
        const error = await res.json();
        xterm.writeln(`\x1b[31mError: ${error.error}\x1b[0m`);
        writePrompt(xterm);
        return;
      }

      const result = await res.json();
      
      if (result.stdout) {
        const lines = result.stdout.split("\n");
        for (const line of lines) {
          xterm.writeln(line);
        }
      }
      
      if (result.stderr) {
        const lines = result.stderr.split("\n");
        for (const line of lines) {
          xterm.writeln(`\x1b[31m${line}\x1b[0m`);
        }
      }

      writePrompt(xterm);
    } catch (error) {
      xterm.writeln(`\x1b[31mConnection error: ${error instanceof Error ? error.message : "Unknown error"}\x1b[0m`);
      writePrompt(xterm);
    }
  }, [sessionId, writePrompt, onClose]);

  // Connect to machine
  useEffect(() => {
    const connect = async () => {
      setIsConnecting(true);
      setConnectionError(null);

      try {
        // Create SSH session
        const res = await fetch(`/api/ssh/${machine.id}`, {
          method: "POST",
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to create SSH session");
        }

        const { sessionId: newSessionId } = await res.json();
        setSessionId(newSessionId);

        // Write welcome message
        const xterm = xtermRef.current;
        if (xterm) {
          xterm.writeln("\x1b[1;35m╔════════════════════════════════════════════════════════╗\x1b[0m");
          xterm.writeln("\x1b[1;35m║\x1b[0m          \x1b[1;36mekmission\x1b[0m SSH Terminal                       \x1b[1;35m║\x1b[0m");
          xterm.writeln("\x1b[1;35m╚════════════════════════════════════════════════════════╝\x1b[0m");
          xterm.writeln("");
          xterm.writeln(`\x1b[90mConnecting to ${machine.name} (${machine.tailscaleIP})...\x1b[0m`);
          xterm.writeln(`\x1b[90mUser: ${machine.ssh.user}\x1b[0m`);
          xterm.writeln("");
          xterm.writeln(`\x1b[32m✓ Connected\x1b[0m`);
          xterm.writeln("");
          writePrompt(xterm);
        }

        setIsConnected(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Connection failed";
        setConnectionError(message);
        
        const xterm = xtermRef.current;
        if (xterm) {
          xterm.writeln(`\x1b[31m✗ ${message}\x1b[0m`);
          xterm.writeln("\x1b[90mPress any key to retry...\x1b[0m");
        }
      } finally {
        setIsConnecting(false);
      }
    };

    connect();

    return () => {
      // Cleanup session on unmount
      if (sessionId) {
        fetch(`/api/ssh/${sessionId}/close`, { method: "DELETE" }).catch(() => {});
      }
    };
  }, [machine.id, machine.name, machine.tailscaleIP, machine.ssh.user, writePrompt, sessionId]);

  // Handle terminal input
  useEffect(() => {
    const xterm = xtermRef.current;
    if (!xterm || !isConnected) return;

    let currentLine = "";

    const handleData = (data: string) => {
      for (const char of data) {
        const code = char.charCodeAt(0);

        // Handle special keys
        if (code === 13) {
          // Enter
          const command = currentLine.trim();
          xterm.writeln("");
          
          if (command) {
            executeCommand(command, xterm);
          } else {
            writePrompt(xterm);
          }
          currentLine = "";
          currentLineRef.current = "";
        } else if (code === 127 || code === 8) {
          // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            currentLineRef.current = currentLine;
            xterm.write("\b \b");
          }
        } else if (code === 3) {
          // Ctrl+C
          xterm.writeln("^C");
          currentLine = "";
          currentLineRef.current = "";
          writePrompt(xterm);
        } else if (code >= 32 && code <= 126) {
          // Printable characters
          currentLine += char;
          currentLineRef.current = currentLine;
          xterm.write(char);
        }
      }
    };

    xterm.onData(handleData);

    return () => {
      // Cleanup
    };
  }, [isConnected, executeCommand, writePrompt]);

  return (
    <div className={cn("flex flex-col h-full bg-[#0a0a0f]", className)}>
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 cursor-pointer transition-colors" onClick={onClose} />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 cursor-pointer transition-colors" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 cursor-pointer transition-colors" />
          </div>
          <span className="text-sm text-white/60">
            {machine.ssh.user}@{machine.name}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className={cn(
            "text-xs",
            isConnected ? "text-green-400" : isConnecting ? "text-yellow-400" : "text-red-400"
          )}>
            {isConnecting ? "● Connecting..." : isConnected ? "● Connected" : "○ Disconnected"}
          </span>
          {isConnected && (
            <button
              onClick={() => {
                xtermRef.current?.clear();
                writePrompt(xtermRef.current!);
              }}
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Terminal content */}
      <div 
        ref={terminalRef} 
        className="flex-1 p-2 overflow-hidden"
      />

      {/* Connection error overlay */}
      {connectionError && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="text-red-400 text-lg mb-2">Connection Failed</div>
            <div className="text-white/60 text-sm mb-4">{connectionError}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
