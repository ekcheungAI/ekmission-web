"use client";

import { useEffect } from "react";
import { useSyncStore } from "@/store/sync";
import { cn } from "@/lib/utils";

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

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return "Never";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "synced":
      return "text-green-400 bg-green-400/10";
    case "behind":
      return "text-yellow-400 bg-yellow-400/10";
    case "syncing":
      return "text-blue-400 bg-blue-400/10 animate-pulse";
    case "offline":
      return "text-gray-400 bg-gray-400/10";
    case "not-set-up":
      return "text-orange-400 bg-orange-400/10";
    default:
      return "text-gray-400 bg-gray-400/10";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "synced":
      return "Synced";
    case "behind":
      return "Behind";
    case "syncing":
      return "Syncing...";
    case "offline":
      return "Offline";
    case "not-set-up":
      return "Not Set Up";
    default:
      return status;
  }
}

export default function SyncPage() {
  const { manifest, isLoading, error, fetchManifest, getDevices, triggerSync } = useSyncStore();

  useEffect(() => {
    fetchManifest();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchManifest, 30000);
    return () => clearInterval(interval);
  }, [fetchManifest]);

  const devices = getDevices();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sync Status</h1>
          <p className="text-white/50 mt-1">
            ekOS dotfiles sync across all devices
          </p>
        </div>
        <button
          onClick={triggerSync}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          <RefreshIcon className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Repo Info */}
      {manifest && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
          <GitBranchIcon className="w-5 h-5 text-white/60" />
          <div>
            <p className="text-sm font-medium">{manifest.repo.url}</p>
            <p className="text-xs text-white/50">Branch: {manifest.repo.branch}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-white/50">Last updated</p>
            <p className="text-sm">{formatTimeAgo(manifest.lastUpdated)}</p>
          </div>
        </div>
      )}

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {devices.map((device) => (
          <div
            key={device.id}
            className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            {/* Device Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                  <span className="text-lg">
                    {device.id === "macbook-pro" ? "💻" : "🖥️"}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold capitalize">{device.id.replace("-", " ")}</h3>
                  <p className="text-xs text-white/50">{device.hostname}</p>
                </div>
              </div>
              <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(device.status))}>
                {getStatusLabel(device.status)}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/50 mb-1">Last Sync</p>
                <p className="text-sm font-mono">{formatTimeAgo(device.lastSync)}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Commit</p>
                <p className="text-sm font-mono text-purple-400">
                  {device.lastCommit?.slice(0, 7) || "None"}
                </p>
              </div>
            </div>

            {/* Behind Remote Warning */}
            {device.behindRemote > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <span>⚠️</span>
                  <span>{device.behindRemote} commits behind remote</span>
                </div>
              </div>
            )}

            {/* Pending Changes */}
            {device.pendingChanges.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-white/50">Pending Changes:</p>
                <div className="space-y-1">
                  {device.pendingChanges.slice(0, 3).map((change, i) => (
                    <div key={i} className="text-xs font-mono text-white/70 bg-white/5 px-2 py-1 rounded">
                      {change}
                    </div>
                  ))}
                  {device.pendingChanges.length > 3 && (
                    <p className="text-xs text-white/50">
                      +{device.pendingChanges.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Device Section */}
      <div className="p-6 rounded-xl border border-dashed border-white/20 bg-white/5 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-xl">+</span>
          </div>
          <div>
            <p className="font-medium">Add New Device</p>
            <p className="text-sm text-white/50">
              Run the bootstrap script on a new machine
            </p>
          </div>
          <code className="text-xs bg-black/30 px-3 py-2 rounded-lg">
            ~/Desktop/ekOS/00_meta/dotfiles/bootstrap-mac.sh
          </code>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <button
          onClick={triggerSync}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-colors disabled:opacity-50"
        >
          <SyncIcon className="w-5 h-5" />
          Sync All Devices
        </button>
        <a
          href="https://github.com/ekcheungAI/ekos"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <GitBranchIcon className="w-5 h-5" />
          View on GitHub
        </a>
      </div>
    </div>
  );
}
