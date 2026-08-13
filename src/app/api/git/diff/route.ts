import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get("hash");

    if (!hash) {
      return NextResponse.json(
        { error: "Commit hash is required" },
        { status: 400 }
      );
    }

    // Get commit stats
    const { stdout: statsOut } = await execAsync(
      `git show --stat --format="%H%n%an%n%ae%n%aI%n%s%n%b" ${hash}`,
      { cwd: process.cwd() }
    );

    // Get diff
    const { stdout: diffOut } = await execAsync(
      `git show ${hash} --format="" -p`,
      { cwd: process.cwd() }
    );

    return NextResponse.json({
      stats: statsOut,
      diff: diffOut,
    });
  } catch (error) {
    console.error("Failed to get commit diff:", error);
    return NextResponse.json(
      { error: "Failed to get commit diff" },
      { status: 500 }
    );
  }
}
