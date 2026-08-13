import { NodeSSH } from "node-ssh";
import type { Machine } from "@/types";

// Session storage (in production, use Redis or similar)
const sshSessions = new Map<string, NodeSSH>();

export async function createSSHSession(machine: Machine): Promise<string> {
  const sessionId = `${machine.id}-${Date.now()}`;
  
  try {
    const ssh = new NodeSSH();
    
    await ssh.connect({
      host: machine.tailscaleIP,
      username: machine.ssh.user,
      privateKeyPath: machine.ssh.keyPath.replace("~", process.env.HOME || ""),
      port: machine.ssh.port,
      readyTimeout: 30000,
    });

    sshSessions.set(sessionId, ssh);
    return sessionId;
  } catch (error) {
    throw new Error(`Failed to create SSH session: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function executeSSHSession(
  sessionId: string,
  command: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const ssh = sshSessions.get(sessionId);
  
  if (!ssh) {
    throw new Error("Session not found or expired");
  }

  try {
    const result = await ssh.execCommand(command, {
      onStdout: (chunk: Buffer) => {},
      onStderr: (chunk: Buffer) => {},
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.code ?? -1,
    };
  } catch (error) {
    throw new Error(`Command failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function closeSSHSession(sessionId: string): Promise<void> {
  const ssh = sshSessions.get(sessionId);
  
  if (ssh) {
    ssh.dispose();
    sshSessions.delete(sessionId);
  }
}

export function getActiveSessions(): string[] {
  return Array.from(sshSessions.keys());
}
