import { Project } from "@/types";

export const defaultProjects: Project[] = [
  {
    id: "heyommi",
    name: "HeyOmmi",
    description: "AI companion app with voice interaction",
    progress: 70,
    status: "active",
    activeAgents: ["ek-dev", "ek-ui", "ek-orch"],
    repo: "github.com/vibemarketing/heyommi",
    url: "https://heyommi.com",
  },
  {
    id: "askclaw",
    name: "AskClaw",
    description: "AI research assistant with deep analysis",
    progress: 30,
    status: "active",
    activeAgents: ["ek-eng"],
    repo: "github.com/vibemarketing/askclaw",
    url: "https://askclaw.com",
  },
  {
    id: "homedaddy",
    name: "HomeDaddy",
    description: "Real estate platform for property discovery",
    progress: 5,
    status: "queued",
    activeAgents: [],
    repo: "github.com/vibemarketing/homedaddy",
    url: "https://homedaddy.gg",
  },
  {
    id: "ekmission",
    name: "ekmission",
    description: "Command center for managing agents and machines",
    progress: 15,
    status: "active",
    activeAgents: ["ek-ops", "ek-ui"],
    repo: "github.com/vibemarketing/ekmission",
    url: "https://ekmission.com",
  },
];
