import { create } from "zustand";

export interface Device {
  id: string;
  hostname: string;
  lastSync: string | null;
  lastCommit: string | null;
  behindRemote: number;
  pendingChanges: string[];
  status: "synced" | "behind" | "syncing" | "offline" | "not-set-up" | "error";
  os?: string;
  location?: string;
  // Enhanced monitoring
  uptime?: number;
  lastActivity?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  networkStatus?: "online" | "offline";
  lastError?: string;
  installedAt?: string;
}

export interface RepoInfo {
  url: string;
  branch: string;
  rawUrl?: string;
  latestCommit?: string;
  latestCommitTime?: string;
  commitCount?: number;
  contributors?: number;
}

interface SyncManifest {
  version: number;
  lastUpdated: string;
  repo: RepoInfo;
  devices: Record<string, Omit<Device, "id">>;
  sync?: {
    autoUpdate: boolean;
    intervalSeconds: number;
    lastCheck?: string;
  };
  stats?: {
    totalDevices: number;
    syncedDevices: number;
    activeDevices: number;
    lastGlobalSync?: string;
  };
}

interface SyncStore {
  manifest: SyncManifest | null;
  githubManifest: SyncManifest | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastFetched: Date | null;
  lastGithubFetch: Date | null;

  // Actions
  fetchManifest: () => Promise<void>;
  fetchFromGithub: () => Promise<void>;
  refreshAll: () => Promise<void>;
  getDevices: () => Device[];
  getDeviceByHostname: (hostname: string) => Device | undefined;
  getOverallStatus: () => "healthy" | "warning" | "error";
  getActiveDevices: () => Device[];
  getSyncedDevices: () => Device[];
  getDevicesBehind: () => Device[];
  getStats: () => {
    total: number;
    active: number;
    synced: number;
    behind: number;
    offline: number;
  };
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  manifest: null,
  githubManifest: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastFetched: null,
  lastGithubFetch: null,

  fetchManifest: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/sync-manifest.json");
      if (!res.ok) throw new Error("Failed to fetch manifest");
      const manifest = await res.json();
      set({ manifest, isLoading: false, lastFetched: new Date() });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error", isLoading: false });
    }
  },

  fetchFromGithub: async () => {
    const { manifest } = get();
    const rawUrl = manifest?.repo?.rawUrl || 
      "https://raw.githubusercontent.com/ekcheungAI/ekos/main/00_meta/dotfiles/sync-manifest.json";
    
    try {
      const res = await fetch(rawUrl);
      if (!res.ok) throw new Error("Failed to fetch from GitHub");
      const githubManifest = await res.json();
      set({ githubManifest, lastGithubFetch: new Date() });
    } catch (err) {
      console.warn("GitHub manifest fetch failed:", err);
    }
  },

  refreshAll: async () => {
    set({ isRefreshing: true });
    await Promise.all([
      get().fetchManifest(),
      get().fetchFromGithub(),
    ]);
    set({ isRefreshing: false });
  },

  getDevices: () => {
    const { manifest, githubManifest } = get();
    if (!manifest) return [];
    
    const devices = Object.entries(manifest.devices || {}).map(([id, device]) => ({
      id,
      ...device,
    }));

    if (githubManifest) {
      const localIds = new Set(devices.map(d => d.id));
      const remoteDevices = Object.entries(githubManifest.devices || {})
        .filter(([id]) => !localIds.has(id))
        .map(([id, device]) => ({ id, ...device }));
      return [...devices, ...remoteDevices];
    }

    return devices;
  },

  getDeviceByHostname: (hostname: string) => {
    return get().getDevices().find((d) => d.hostname === hostname);
  },

  getOverallStatus: () => {
    const devices = get().getDevices();
    if (devices.length === 0) return "error";
    
    const hasError = devices.some(d => 
      d.status === "offline" || 
      d.status === "error" || 
      d.status === "not-set-up"
    );
    const hasWarning = devices.some(d => 
      d.status === "behind" || 
      d.behindRemote > 0 ||
      d.pendingChanges.length > 0
    );
    
    if (hasError) return "error";
    if (hasWarning) return "warning";
    return "healthy";
  },

  getActiveDevices: () => {
    return get().getDevices().filter((d) => {
      if (!d.lastSync) return false;
      const oneHourAgo = Date.now() - 3600000;
      return new Date(d.lastSync).getTime() > oneHourAgo;
    });
  },

  getSyncedDevices: () => {
    return get().getDevices().filter((d) => d.status === "synced");
  },

  getDevicesBehind: () => {
    return get().getDevices().filter((d) => d.behindRemote > 0);
  },

  getStats: () => {
    const devices = get().getDevices();
    return {
      total: devices.length,
      active: devices.filter((d) => {
        if (!d.lastSync) return false;
        const oneHourAgo = Date.now() - 3600000;
        return new Date(d.lastSync).getTime() > oneHourAgo;
      }).length,
      synced: devices.filter((d) => d.status === "synced").length,
      behind: devices.filter((d) => d.behindRemote > 0).length,
      offline: devices.filter((d) => d.status === "offline" || d.status === "not-set-up").length,
    };
  },
}));
