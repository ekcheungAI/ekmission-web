import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface Branch {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  trackingBranch?: string;
}

export async function GET() {
  try {
    const { stdout } = await execAsync("git branch -a --format='%(refname:short)' 2>/dev/null || git branch --format='%(refname:short)'", {
      cwd: process.cwd(),
    });

    const branches: Branch[] = [];
    const lines = stdout.split("\n").filter(Boolean);

    for (const line of lines) {
      const name = line.trim();
      if (!name) continue;

      const isRemote = name.startsWith("remotes/");
      const isCurrent = name.startsWith("* ");
      
      branches.push({
        name: isCurrent ? name.slice(2) : name,
        isCurrent,
        isRemote,
      });
    }

    return NextResponse.json(branches);
  } catch (error) {
    console.error("Failed to list branches:", error);
    return NextResponse.json(
      { error: "Failed to list branches" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, startPoint } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Branch name is required" },
        { status: 400 }
      );
    }

    // Validate branch name
    if (!/^[a-zA-Z0-9._\/-]+$/.test(name)) {
      return NextResponse.json(
        { error: "Invalid branch name" },
        { status: 400 }
      );
    }

    let command = `git branch "${name}"`;
    if (startPoint) {
      command = `git branch "${name}" "${startPoint}"`;
    }

    await execAsync(command, { cwd: process.cwd() });

    return NextResponse.json({ success: true, name });
  } catch (error) {
    console.error("Failed to create branch:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create branch" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { name, force } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Branch name is required" },
        { status: 400 }
      );
    }

    // Prevent deleting protected branches
    if (name === "main" || name === "master" || name === "develop") {
      return NextResponse.json(
        { error: "Cannot delete protected branch" },
        { status: 400 }
      );
    }

    const command = force 
      ? `git branch -D "${name}"`
      : `git branch -d "${name}"`;

    await execAsync(command, { cwd: process.cwd() });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete branch:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete branch" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Branch name is required" },
        { status: 400 }
      );
    }

    await execAsync(`git checkout "${name}"`, { cwd: process.cwd() });

    return NextResponse.json({ success: true, name });
  } catch (error) {
    console.error("Failed to switch branch:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to switch branch" },
      { status: 500 }
    );
  }
}
