import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface Worktree {
  path: string;
  branch: string;
  isBare: boolean;
  isCurrent: boolean;
}

export async function GET() {
  try {
    const { stdout } = await execAsync("git worktree list --porcelain", {
      cwd: process.cwd(),
    });

    const worktrees: Worktree[] = [];
    const entries = stdout.split("\n\n").filter(Boolean);

    for (const entry of entries) {
      const lines = entry.split("\n");
      let path = "";
      let branch = "";
      let isBare = false;

      for (const line of lines) {
        if (line.startsWith("worktree ")) {
          path = line.replace("worktree ", "").replace(/^./, "");
        } else if (line.startsWith("branch ")) {
          branch = line.replace("branch ", "");
        } else if (line === "bare") {
          isBare = true;
        }
      }

      if (path) {
        const isMain = entry.includes("(detached)");
        worktrees.push({
          path,
          branch: isMain ? "(detached)" : branch || "(unknown)",
          isBare,
          isCurrent: entry.includes("(current)") || lines.some(l => l.includes("(current)")),
        });
      }
    }

    return NextResponse.json(worktrees);
  } catch (error) {
    console.error("Failed to list worktrees:", error);
    return NextResponse.json(
      { error: "Failed to list worktrees" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path, branch, createBranch } = body;

    if (!path || !branch) {
      return NextResponse.json(
        { error: "Path and branch are required" },
        { status: 400 }
      );
    }

    let command = `git worktree add "${path}"`;
    
    if (createBranch) {
      command = `git worktree add -b "${branch}" "${path}"`;
    } else {
      command = `git worktree add "${path}" "${branch}"`;
    }

    await execAsync(command, { cwd: process.cwd() });

    return NextResponse.json({ success: true, path, branch });
  } catch (error) {
    console.error("Failed to create worktree:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create worktree" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { path, force } = body;

    if (!path) {
      return NextResponse.json(
        { error: "Worktree path is required" },
        { status: 400 }
      );
    }

    const command = force 
      ? `git worktree remove "${path}" --force`
      : `git worktree remove "${path}"`;

    await execAsync(command, { cwd: process.cwd() });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove worktree:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove worktree" },
      { status: 500 }
    );
  }
}
