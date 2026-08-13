"use client";

import { useEffect, useState, useCallback } from "react";
import { useSyncStore } from "@/store/sync";
import { cn } from "@/lib/utils";

// Icons
function SyncIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

function GitBranchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ServerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  );
}

function formatTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) return "Never";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString();
}

function getStatusConfig(status: string) {
  switch (status) {
    case "synced":
      return {
        color: "text-green-400 bg-green-400/10 border-green-400/20",
        bg: "bg-green-500/10",
        dot: "bg-green-500",
        label: "Synced",
        icon: <CheckIcon className="w-3 h-3" />,
      };
    case "behind":
      return {
        color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
        bg: "bg-yellow-500/10",
        dot: "bg-yellow-500 animate-pulse",
        label: "Behind",
        icon: <AlertIcon className="w-3 h-3" />,
      };
    case "syncing":
      return {
        color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
        bg: "bg-blue-500/10",
        dot: "bg-blue-500 animate-pulse",
        label: "Syncing...",
        icon: <SyncIcon className="w-3 h-3 animate-spin" />,
      };
    case "offline":
      return {
        color: "text-gray-400 bg-gray-400/10 border-gray-400/20",
        bg: "bg-gray-500/10",
        dot: "bg-gray-500",
        label: "Offline",
        icon: <ServerIcon className="w-3 h-3" />,
      };
    case "not-set-up":
      return {
        color: "text-orange-400 bg-orange-400/10 border-orange-400/20",
        bg: "bg-orange-500/10",
        dot: "bg-orange-500",
        label: "Not Set Up",
        icon: <AlertIcon className="w-3 h-3" />,
      };
    case "error":
      return {
        color: "text-red-400 bg-red-400/10 border-red-400/20",
        bg: "bg-red-500/10",
        dot: "bg-red-500 animate-pulse",
        label: "Error",
        icon: <AlertIcon className="w-3 h-3" />,
      };
    default:
      return {
        color: "text-gray-400 bg-gray-400/10 border-gray-400/20",
        bg: "bg-gray-500/10",
        dot: "bg-gray-500",
        label: status,
        icon: null,
      };
  }
}

function getOverallStatusConfig(status: "healthy" | "warning" | "error") {
  switch (status) {
    case "healthy":
      return {
        color: "text-green-400",
        bg: "bg-green-500/20",
        border: "border-green-500/30",
        label: "All devices synced",
        icon: <CheckIcon className="w-5 h-5" />,
      };
    case "warning":
      return {
        color: "text-yellow-400",
        bg: "bg-yellow-500/20",
        border: "border-yellow-500/30",
        label: "Some devices need attention",
        icon: <AlertIcon className="w-5 h-5" />,
      };
    case "error":
      return {
        color: "text-red-400",
        bg: "bg-red-500/20",
        border: "border-red-500/30",
        label: "Sync issues detected",
        icon: <AlertIcon className="w-5 h-5" />,
      };
  }
}

function DeviceCard({ device }: { device: ReturnType<typeof useSyncStore.getState>["getDevices"][number] }) {
  const config = getStatusConfig(device.status);
  
  return (
    <div className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
            <span className="text-2xl">
              {device.id.includes("macbook") ? "💻" : device.id.includes("mac-mini") ? "🖥️" : "🖥️"}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-base capitalize">{device.id.replace(/-/g, " ")}</h3>
            <p className="text-xs text-white/50">{device.hostname}</p>
            {device.location && (
              <p className="text-xs text-white/30">{device.location}</p>
            )}
          </div>
        </div>
        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", config.color, config.bg)}>
          {config.icon}
          {config.label}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <ClockIcon className="w-3.5 h-3.5" />
            Last Sync
          </div>
          <p className="text-sm font-mono">{formatTimeAgo(device.lastSync)}</p>
          <p className="text-xs text-white/30">{formatDate(device.lastSync)}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <GitBranchIcon className="w-3.5 h-3.5" />
            Commit
          </div>
          <p className="text-sm font-mono text-purple-400">
            {device.lastCommit?.slice(0, 7) || "None"}
          </p>
          <p className="text-xs text-white/30">
            {device.behindRemote > 0 ? `${device.behindRemote} behind` : "Up to date"}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {device.behindRemote > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <AlertIcon className="w-4 h-4 flex-shrink-0" />
            <span>{device.behindRemote} commit{device.behindRemote > 1 ? "s" : ""} behind remote</span>
          </div>
        </div>
      )}

      {device.pendingChanges.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-blue-400 mb-2">Uncommitted changes:</p>
          <div className="space-y-1">
            {device.pendingChanges.slice(0, 3).map((change, i) => (
              <div key={i} className="text-xs font-mono text-white/60 bg-black/20 px-2 py-1 rounded">
                {change}
              </div>
            ))}
            {device.pendingChanges.length > 3 && (
              <p className="text-xs text-white/40">+{device.pendingChanges.length - 3} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SyncPage() {
  const { 
    manifest, 
    isLoading, 
    isRefreshing,
    error, 
    fetchManifest, 
    fetchFromGithub,
    refreshAll, 
    getDevices, 
    getOverallStatus,
    lastFetched,
  } = useSyncStore();

  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = useCallback(async () => {
    await fetchManifest();
    await fetchFromGithub();
  }, [fetchManifest, fetchFromGithub]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const devices = getDevices();
  const overallStatus = getOverallStatus();
  const overallConfig = getOverallStatusConfig(overallStatus);

  const syncedCount = devices.filter(d => d.status === "synced").length;
  const totalCount = devices.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sync Status</h1>
          <p className="text-white/50 mt-1">
            ekOS dotfiles sync across all devices
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm",
              autoRefresh 
                ? "bg-green-500/20 border-green-500/30 text-green-400" 
                : "bg-white/10 border-white/20 text-white/60 hover:text-white"
            )}
          >
            <span className={cn("w-2 h-2 rounded-full", autoRefresh ? "bg-green-500 animate-pulse" : "bg-gray-500")} />
            {autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
          </button>
          <button
            onClick={refreshAll}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshIcon className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
          <AlertIcon className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load sync data</p>
            <p className="text-sm text-red-400/70">{error}</p>
          </div>
          <button 
            onClick={refreshAll}
            className="ml-auto px-3 py-1 rounded bg-red-500/20 text-sm hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* Overall Status Banner */}
      <div className={cn("p-5 rounded-xl border flex items-center gap-4", overallConfig.bg, overallConfig.border)}>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", overallConfig.color)}>
          {overallConfig.icon}
        </div>
        <div>
          <h2 className={cn("font-semibold", overallConfig.color)}>
            {overallConfig.label}
          </h2>
          <p className="text-sm text-white/60">
            {syncedCount} of {totalCount} device{totalCount !== 1 ? "s" : ""} synced
            {lastFetched && (
              <span className="text-white/40"> • Last checked {formatTimeAgo(lastFetched.toISOString())}</span>
            )}
          </p>
        </div>
        <div className="ml-auto">
          <div className="flex gap-1">
            {devices.map((device) => {
              const config = getStatusConfig(device.status);
              return (
                <div 
                  key={device.id}
                  className={cn("w-3 h-3 rounded-full border-2", config.dot)}
                  title={`${device.id}: ${device.status}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Repo Info */}
      {manifest && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <GitBranchIcon className="w-5 h-5 text-white/60 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <a 
              href={manifest.repo.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium hover:text-purple-400 transition-colors truncate block"
            >
              {manifest.repo.url}
            </a>
            <p className="text-xs text-white/50">
              Branch: <span className="text-purple-400">{manifest.repo.branch}</span>
              {manifest.repo.latestCommit && (
                <> • Latest: <span className="text-white/70">{manifest.repo.latestCommit.slice(0, 7)}</span></>
              )}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-white/50">Last updated</p>
            <p className="text-sm">{formatTimeAgo(manifest.lastUpdated)}</p>
          </div>
        </div>
      )}

      {/* Devices Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Devices</h2>
          <span className="text-sm text-white/50">{devices.length} device{devices.length !== 1 ? "s" : ""}</span>
        </div>
        
        {devices.length === 0 ? (
          <div className="p-12 rounded-xl border border-dashed border-white/20 text-center">
            <ServerIcon className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No devices configured yet</p>
            <p className="text-sm text-white/40 mt-1">Add a device using the bootstrap script</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {devices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        )}
      </div>

      {/* Add Device Section */}
      <div className="p-6 rounded-xl border border-dashed border-white/20 bg-white/5">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">+</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Add New Device</h3>
            <p className="text-sm text-white/50 mt-0.5">
              Run the bootstrap script on a new machine to sync dotfiles
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <code className="flex-1 text-xs bg-black/30 px-4 py-3 rounded-lg font-mono text-white/70">
            ~/Desktop/ekOS/00_meta/dotfiles/bootstrap-mac.sh
          </code>
          <a
            href="https://github.com/ekcheungAI/ekos"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm flex-shrink-0"
          >
            View on GitHub
          </a>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <button
          onClick={refreshAll}
          disabled={isRefreshing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-all disabled:opacity-50 font-medium"
        >
          <SyncIcon className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
          Sync All Devices
        </button>
        <a
          href="https://github.com/ekcheungAI/ekos"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all font-medium"
        >
          <GitBranchIcon className="w-5 h-5" />
          GitHub
        </a>
      </div>
    </div>
  );
}
