#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execSync } from "child_process";
import { readFileSync } from "fs";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || "";
const OIDC_TOKEN = process.env.VERCEL_OIDC_TOKEN || "";

const server = new McpServer({
  name: "Vercel CLI",
  version: "1.0.0",
});

const runVercel = (args) => {
  try {
    const output = execSync(`vercel ${args}`, {
      encoding: "utf-8",
      env: {
        ...process.env,
        VERCEL_TOKEN,
        VERCEL_OIDC_TOKEN,
      },
    });
    return output;
  } catch (error) {
    return error.stdout || error.message;
  }
};

server.tool(
  "vercel-whoami",
  "Check Vercel authentication",
  {},
  async () => {
    const output = runVercel("whoami");
    return {
      content: [{ type: "text", text: output.trim() }],
    };
  }
);

server.tool(
  "vercel-projects",
  "List Vercel projects",
  {},
  async () => {
    const output = runVercel("projects ls --json");
    try {
      const projects = JSON.parse(output);
      return {
        content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
      };
    } catch {
      return { content: [{ type: "text", text: output }] };
    }
  }
);

server.tool(
  "vercel-deployments",
  "List recent Vercel deployments",
  {
    project: z.string().optional().describe("Project name filter"),
    limit: z.string().optional().describe("Number of deployments (default 10)"),
  },
  async ({ project, limit = "10" }) => {
    const args = project
      ? `deployments ls ${project} --limit ${limit} --json`
      : `deployments ls --limit ${limit} --json`;
    const output = runVercel(args);
    try {
      const deployments = JSON.parse(output);
      return {
        content: [{ type: "text", text: JSON.stringify(deployments, null, 2) }],
      };
    } catch {
      return { content: [{ type: "text", text: output }] };
    }
  }
);

server.tool(
  "vercel-logs",
  "Get deployment logs",
  {
    url: z.string().describe("Deployment URL"),
    follow: z.boolean().optional().describe("Follow logs in real-time"),
  },
  async ({ url, follow }) => {
    const args = follow ? `logs ${url} --follow` : `logs ${url}`;
    const output = runVercel(args);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "vercel-env",
  "List environment variables",
  {
    project: z.string().describe("Project name"),
    decrypt: z.boolean().optional().describe("Decrypt values"),
  },
  async ({ project, decrypt = true }) => {
    const args = `env ls ${project}${decrypt ? " --decrypt" : ""} --json`;
    const output = runVercel(args);
    try {
      const envs = JSON.parse(output);
      return {
        content: [{ type: "text", text: JSON.stringify(envs, null, 2) }],
      };
    } catch {
      return { content: [{ type: "text", text: output }] };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Vercel MCP server running on stdio");
}

main().catch(console.error);
