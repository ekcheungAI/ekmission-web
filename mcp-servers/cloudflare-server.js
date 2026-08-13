#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execSync } from "child_process";

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";

const server = new McpServer({
  name: "Cloudflare CLI",
  version: "1.0.0",
});

const cfApi = (endpoint, options = {}) => {
  const cmd = `curl -s "https://api.cloudflare.com/client/v4${endpoint}" -H "Authorization: Bearer ${CF_API_TOKEN}" ${Object.entries(options).map(([k,v]) => `-H "${k}: ${v}"`).join(' ')}`;
  try {
    return JSON.parse(execSync(cmd, { encoding: "utf-8" }));
  } catch (e) {
    return JSON.parse(e.stdout || '{}');
  }
};

server.tool(
  "cf-list-zones",
  "List all Cloudflare zones/domains",
  {},
  async () => ({ content: [{ type: "text", text: JSON.stringify(cfApi("/zones"), null, 2) }] })
);

server.tool(
  "cf-list-dns",
  "List DNS records for a zone",
  { zoneId: z.string() },
  async ({ zoneId }) => ({ content: [{ type: "text", text: JSON.stringify(cfApi(`/zones/${zoneId}/dns_records`), null, 2) }] })
);

server.tool(
  "cf-add-dns",
  "Add a DNS record",
  { zoneId: z.string(), type: z.string(), name: z.string(), content: z.string(), proxied: z.boolean().optional() },
  async ({ zoneId, ...data }) => {
    const result = execSync(`curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records" -H "Authorization: Bearer ${CF_API_TOKEN}" -H "Content-Type: application/json" -d '${JSON.stringify(data)}'`, { encoding: "utf-8" });
    return { content: [{ type: "text", text: result }] };
  }
);

server.tool(
  "cf-verify-token",
  "Verify Cloudflare API token is valid",
  {},
  async () => {
    const result = cfApi("/user/tokens/verify");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
server.run(transport).catch(console.error);
