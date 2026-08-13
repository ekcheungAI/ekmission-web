import { NodeSSH } from "node-ssh";
import type { Machine } from "@/types";

export interface SSHResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface StreamCallback {
  (chunk: string, type: "stdout" | "stderr"): void;
}

export async function connectToMachine(machine: Machine): Promise<NodeSSH> {
  const ssh = new NodeSSH();
  
  await ssh.connect({
    host: machine.tailscaleIP,
    username: machine.ssh.user,
    privateKeyPath: machine.ssh.keyPath.replace("~", process.env.HOME || ""),
    port: machine.ssh.port,
    readyTimeout: 30000,
  });

  return ssh;
}

export async function executeOnMachine(
  machine: Machine,
  command: string,
  options?: {
    cwd?: string;
    streamCallback?: StreamCallback;
    timeout?: number;
  }
): Promise<SSHResult> {
  const ssh = await connectToMachine(machine);

  try {
    const result = await ssh.execCommand(command, {
      cwd: options?.cwd || process.env.HOME,
      onStdout: (chunk: Buffer) => {
        options?.streamCallback?.(chunk.toString(), "stdout");
      },
      onStderr: (chunk: Buffer) => {
        options?.streamCallback?.(chunk.toString(), "stderr");
      },
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.code ?? -1,
    };
  } finally {
    ssh.dispose();
  }
}

export async function executeOnMachineWithPTY(
  machine: Machine,
  command: string,
  onData: (data: string) => void,
  onClose: () => void
): Promise<void> {
  const ssh = await connectToMachine(machine);

  try {
    await ssh.execCommand(command, {
      onStdout: (chunk: Buffer) => onData(chunk.toString()),
      onStderr: (chunk: Buffer) => onData(chunk.toString()),
    });
    onClose();
  } catch (error) {
    onData(`Error: ${error instanceof Error ? error.message : "Unknown error"}\n`);
    onClose();
  } finally {
    ssh.dispose();
  }
}

export async function checkMachineStatus(machine: Machine): Promise<{
  online: boolean;
  cpu?: number;
  memory?: { used: number; total: number };
}> {
  try {
    const result = await executeOnMachine(machine, `
      echo "STATUS:OK"
      top -l 1 -n 1 | grep "CPU usage" | awk '{print "CPU:"$3}'
      vm_stat | head -5
    `);

    return {
      online: result.exitCode === 0 && result.stdout.includes("STATUS:OK"),
    };
  } catch {
    return { online: false };
  }
}

export async function getMachineSystemInfo(machine: Machine): Promise<{
  hostname: string;
  uptime: string;
  cpu: string;
  memory: { used: number; total: number };
  disk: { used: number; total: number };
} | null> {
  try {
    const result = await executeOnMachine(machine, `
      echo "HOSTNAME:$(hostname)"
      uptime | sed 's/.*up/up/'
      sysctl -n machdep.cpu.brand_string
      vm_stat | grep "Pages active" | awk '{print "MEM:"$3}'
      df -h / | tail -1 | awk '{print "DISK:"$2":"$3":"$5}'
    `);

    // Parse output
    const lines = result.stdout.split("\n").filter(Boolean);
    const data: Record<string, string> = {};
    
    for (const line of lines) {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length) {
        data[key] = valueParts.join(":");
      }
    }

    return {
      hostname: data.HOSTNAME || machine.hostname,
      uptime: data.up || "unknown",
      cpu: data.cpu || "unknown",
      memory: { used: 0, total: 32 }, // TODO: parse properly
      disk: { used: 0, total: 1000 },
    };
  } catch {
    return null;
  }
}
