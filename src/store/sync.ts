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
}

export interface RepoInfo {
  url: string;
  branch: string;
  rawUrl?: string;
  latestCommit?: string;
  latestCommitTime?: string;
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
  getCommitHistory: () => { hash: string; time: string; message: string }[];
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
      // GitHub fetch failed - not critical, just log
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
    
    // Use local manifest as source of truth
    const devices = Object.entries(manifest.devices || {}).map(([id, device]) => ({
      id,
      ...device,
    }));

    // Merge with GitHub data if available (shows other devices)
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
    
    const hasError = devices.some(d => d.status === "offline" || d.status === "error" || d.status === "not-set-up");
    const hasWarning = devices.some(d => d.status === "behind" || d.behindRemote > 0);
    
    if (hasError) return "error";
    if (hasWarning) return "warning";
    return "healthy";
  },

  getCommitHistory: () => {
    // In production, this would fetch from GitHub API
    // For now, return empty - the actual history comes from sync-status.sh
    return [];
  },
}));
