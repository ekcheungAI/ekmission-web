import { create } from "zustand";

export interface Device {
  id: string;
  hostname: string;
  lastSync: string | null;
  lastCommit: string | null;
  behindRemote: number;
  pendingChanges: string[];
  status: "synced" | "behind" | "syncing" | "offline" | "not-set-up";
}

interface SyncManifest {
  version: number;
  lastUpdated: string;
  devices: Record<string, Omit<Device, "id">>;
  repo: {
    url: string;
    branch: string;
  };
}

interface SyncStore {
  manifest: SyncManifest | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;

  // Actions
  fetchManifest: () => Promise<void>;
  getDevices: () => Device[];
  getDeviceByHostname: (hostname: string) => Device | undefined;
  triggerSync: () => Promise<void>;
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  manifest: null,
  isLoading: false,
  error: null,
  lastFetched: null,

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

  getDevices: () => {
    const { manifest } = get();
    if (!manifest) return [];
    return Object.entries(manifest.devices).map(([id, device]) => ({
      id,
      ...device,
    }));
  },

  getDeviceByHostname: (hostname: string) => {
    const devices = get().getDevices();
    return devices.find((d) => d.hostname === hostname);
  },

  triggerSync: async () => {
    // In a real app, this would trigger a sync via an API or SSH
    // For now, we'll just refresh the manifest
    await get().fetchManifest();
  },
}));
