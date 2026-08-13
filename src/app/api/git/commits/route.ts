import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface Commit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
  branch?: string;
  tags?: string[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const branch = searchParams.get("branch") || "HEAD";

    // Get commit log with formatting
    const format = "%H|%h|%an|%ae|%aI|%s";
    const { stdout } = await execAsync(
      `git log --format="${format}" -n ${limit} ${branch} 2>/dev/null || git log --format="${format}" -n ${limit}`,
      { cwd: process.cwd() }
    );

    const commits: Commit[] = [];
    const lines = stdout.split("\n").filter(Boolean);

    for (const line of lines) {
      const parts = line.split("|");
      if (parts.length >= 6) {
        commits.push({
          hash: parts[0],
          shortHash: parts[1],
          author: parts[2],
          email: parts[3],
          date: parts[4],
          message: parts.slice(5).join("|"),
        });
      }
    }

    // Get branch and tag info for each commit
    for (const commit of commits) {
      try {
        // Get branch info
        const { stdout: branchOut } = await execAsync(
          `git branch --contains ${commit.hash} --format="%(refname:short)" 2>/dev/null | head -1`,
          { cwd: process.cwd() }
        );
        if (branchOut.trim()) {
          commit.branch = branchOut.trim().split("\n")[0];
        }
      } catch {}

      try {
        // Get tags
        const { stdout: tagOut } = await execAsync(
          `git tag --contains ${commit.hash} 2>/dev/null | head -3`,
          { cwd: process.cwd() }
        );
        if (tagOut.trim()) {
          commit.tags = tagOut.trim().split("\n").filter(Boolean);
        }
      } catch {}
    }

    return NextResponse.json(commits);
  } catch (error) {
    console.error("Failed to get commits:", error);
    return NextResponse.json(
      { error: "Failed to get commits" },
      { status: 500 }
    );
  }
}
