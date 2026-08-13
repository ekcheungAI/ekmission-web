import type { Machine } from "@/types";

export const defaultMachines: Machine[] = [
  {
    id: "ekmini",
    name: "ekmini (Primary)",
    hostname: "ekmini",
    tailscaleIP: "100.99.216.12",
    description: "Primary Mac - currently running this dashboard",
    ssh: {
      user: "ek",
      keyPath: "~/.ssh/id_ed25519",
      port: 22,
    },
    capabilities: ["build", "dev", "deploy", "all"],
    location: "Home Lab",
    specs: {
      cpu: "Apple Silicon",
      ram: "Unknown",
      disk: "Unknown",
    },
    currentAgents: [],
    status: "online",
  },
  {
    id: "ek-mac-pro",
    name: "ek-mac-pro (Secondary)",
    hostname: "ek-mac-pro",
    tailscaleIP: "100.77.215.35",
    description: "Secondary Mac Pro - available for additional workloads",
    ssh: {
      user: "ek",
      keyPath: "~/.ssh/id_ed25519",
      port: 22,
    },
    capabilities: ["build", "dev", "deploy", "all"],
    location: "Home Lab",
    specs: {
      cpu: "Apple Silicon",
      ram: "Unknown",
      disk: "Unknown",
    },
    currentAgents: [],
    status: "online",
  },
  {
    id: "streaming-room2",
    name: "Streaming Room 2",
    hostname: "streaming-room2",
    tailscaleIP: "100.79.8.56",
    description: "Windows streaming rig - can run CI/CD agents",
    ssh: {
      user: "ek",
      keyPath: "~/.ssh/id_ed25519",
      port: 22,
    },
    capabilities: ["build", "deploy"],
    location: "Home Lab",
    specs: {
      cpu: "Intel/AMD",
      ram: "Unknown",
      disk: "Unknown",
    },
    currentAgents: [],
    status: "offline",
  },
];
