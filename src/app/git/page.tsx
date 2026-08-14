"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type TabType = "worktrees" | "branches" | "commits";

interface Worktree {
  path: string;
  branch: string;
  isBare: boolean;
  isCurrent: boolean;
}

interface Branch {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
}

interface Commit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
  branch?: string;
  tags?: string[];
}

export default function GitPage() {
  const [activeTab, setActiveTab] = useState<TabType>("worktrees");
  const [worktrees, setWorktrees] = useState<Worktree[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Worktree form
  const [showWorktreeForm, setShowWorktreeForm] = useState(false);
  const [worktreePath, setWorktreePath] = useState("");
  const [worktreeBranch, setWorktreeBranch] = useState("");
  const [createNewBranch, setCreateNewBranch] = useState(false);
  
  // Branch form
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [branchFrom, setBranchFrom] = useState("HEAD");
  
  // Diff viewer
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [commitDiff, setCommitDiff] = useState<string>("");

  const fetchWorktrees = useCallback(async () => {
    try {
      const res = await fetch("/api/git/worktrees");
      if (res.ok) {
        const data = await res.json();
        setWorktrees(data);
      }
    } catch {}
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch("/api/git/branches");
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
      }
    } catch {}
  }, []);

  const fetchCommits = useCallback(async () => {
    try {
      const res = await fetch("/api/git/commits?limit=50");
      if (res.ok) {
        const data = await res.json();
        setCommits(data);
      }
    } catch {}
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([fetchWorktrees(), fetchBranches(), fetchCommits()]);
    } catch {
      setError("Failed to fetch git data");
    } finally {
      setIsLoading(false);
    }
  }, [fetchWorktrees, fetchBranches, fetchCommits]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateWorktree = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/git/worktrees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: worktreePath,
          branch: worktreeBranch,
          createBranch: createNewBranch,
        }),
      });
      
      if (res.ok) {
        setShowWorktreeForm(false);
        setWorktreePath("");
        setWorktreeBranch("");
        setCreateNewBranch(false);
        fetchWorktrees();
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch {
      setError("Failed to create worktree");
    }
  };

  const handleDeleteWorktree = async (path: string) => {
    if (!confirm(`Remove worktree at ${path}?`)) return;
    
    try {
      const res = await fetch("/api/git/worktrees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, force: true }),
      });
      
      if (res.ok) {
        fetchWorktrees();
      }
    } catch {
      setError("Failed to remove worktree");
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/git/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBranchName, startPoint: branchFrom }),
      });
      
      if (res.ok) {
        setShowBranchForm(false);
        setNewBranchName("");
        setBranchFrom("HEAD");
        fetchBranches();
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch {
      setError("Failed to create branch");
    }
  };

  const handleDeleteBranch = async (name: string) => {
    if (!confirm(`Delete branch ${name}?`)) return;
    
    try {
      const res = await fetch("/api/git/branches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, force: true }),
      });
      
      if (res.ok) {
        fetchBranches();
      }
    } catch {
      setError("Failed to delete branch");
    }
  };

  const handleSwitchBranch = async (name: string) => {
    try {
      const res = await fetch("/api/git/branches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      
      if (res.ok) {
        fetchBranches();
      }
    } catch {
      setError("Failed to switch branch");
    }
  };

  const handleViewCommit = async (commit: Commit) => {
    setSelectedCommit(commit);
    try {
      const res = await fetch(`/api/git/diff?hash=${commit.hash}`);
      if (res.ok) {
        const data = await res.json();
        setCommitDiff(data.diff);
      }
    } catch {
      setCommitDiff("Failed to load diff");
    }
  };

  const tabs = [
    { id: "worktrees" as const, label: "Worktrees", count: worktrees.length },
    { id: "branches" as const, label: "Branches", count: branches.filter(b => !b.isRemote).length },
    { id: "commits" as const, label: "Commits", count: commits.length },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <svg className="w-7 h-7 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.6 10.59L8.38 4.8l1.69 1.7c-.24.85.15 1.78.93 2.23v5.54c-.6.34-1 .99-1 1.73a2 2 0 002 2 2 2 0 002-2c0-.74-.4-1.39-1-1.73V9.41l2.07 2.09c-.07.15-.07.32-.07.5a2 2 0 002 2 2 2 0 002-2 2 2 0 00-2-2c-.18 0-.35 0-.5-.07L13.93 8.5a1.98 1.98 0 00-1.15-2.34c-.43-.16-.88-.23-1.33-.23-.65 0-1.25.15-1.79.46l1.69 1.7-5.63 5.63c.42.58.67 1.28.67 2.05a3.18 3.18 0 01-3.18 3.18 3.18 3.18 0 01-3.18-3.18c0-.77.25-1.47.67-2.05z"/>
            </svg>
            Git Management
          </h1>
          <p className="text-white/50 text-sm mt-1">Manage worktrees, branches, and commits</p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-all flex items-center gap-2 text-sm"
        >
          <svg className={cn("w-4 h-4", isLoading && "animate-spin")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 py-2 border-b border-white/10 bg-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-purple-500/20 text-purple-400"
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            {tab.label}
            <span className="ml-2 px-1.5 py-0.5 rounded bg-white/10 text-xs">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto hover:text-red-300">
            Dismiss
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-white/50">Loading git data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Worktrees Tab */}
            {activeTab === "worktrees" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-white">Worktrees</h2>
                  <button
                    onClick={() => setShowWorktreeForm(true)}
                    className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Worktree
                  </button>
                </div>

                {/* Worktree form modal */}
                {showWorktreeForm && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1a1a1f] border border-white/10 rounded-xl p-6 w-full max-w-md">
                      <h3 className="text-lg font-medium text-white mb-4">Create Worktree</h3>
                      <form onSubmit={handleCreateWorktree} className="space-y-4">
                        <div>
                          <label className="block text-sm text-white/60 mb-1">Path</label>
                          <input
                            type="text"
                            value={worktreePath}
                            onChange={(e) => setWorktreePath(e.target.value)}
                            placeholder="/path/to/worktree"
                            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/30 outline-none focus:border-purple-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/60 mb-1">Branch</label>
                          <input
                            type="text"
                            value={worktreeBranch}
                            onChange={(e) => setWorktreeBranch(e.target.value)}
                            placeholder="feature/new-feature"
                            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/30 outline-none focus:border-purple-500"
                            required
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="createNew"
                            checked={createNewBranch}
                            onChange={(e) => setCreateNewBranch(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-black/30 text-purple-500 focus:ring-purple-500"
                          />
                          <label htmlFor="createNew" className="text-sm text-white/60">
                            Create new branch
                          </label>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowWorktreeForm(false)}
                            className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                          >
                            Create
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {worktrees.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-white/20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <p className="text-white/50">No worktrees found</p>
                    <p className="text-white/30 text-sm mt-1">Create a worktree to work on multiple branches simultaneously</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {worktrees.map((wt, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            wt.isCurrent ? "bg-green-500" : "bg-white/20"
                          )} />
                          <div>
                            <p className="text-white font-mono text-sm">{wt.path}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                                {wt.branch}
                              </span>
                              {wt.isCurrent && (
                                <span className="text-xs text-green-400">current</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteWorktree(wt.path)}
                          className="p-2 text-white/30 hover:text-red-400 transition-colors"
                          title="Remove worktree"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Branches Tab */}
            {activeTab === "branches" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-white">Branches</h2>
                  <button
                    onClick={() => setShowBranchForm(true)}
                    className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Branch
                  </button>
                </div>

                {/* Branch form modal */}
                {showBranchForm && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1a1a1f] border border-white/10 rounded-xl p-6 w-full max-w-md">
                      <h3 className="text-lg font-medium text-white mb-4">Create Branch</h3>
                      <form onSubmit={handleCreateBranch} className="space-y-4">
                        <div>
                          <label className="block text-sm text-white/60 mb-1">Branch Name</label>
                          <input
                            type="text"
                            value={newBranchName}
                            onChange={(e) => setNewBranchName(e.target.value)}
                            placeholder="feature/my-feature"
                            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/30 outline-none focus:border-purple-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/60 mb-1">Start From</label>
                          <select
                            value={branchFrom}
                            onChange={(e) => setBranchFrom(e.target.value)}
                            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white outline-none focus:border-purple-500"
                          >
                            <option value="HEAD">HEAD (current)</option>
                            {branches.filter(b => !b.isRemote && !b.isCurrent).map((b) => (
                              <option key={b.name} value={b.name}>{b.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowBranchForm(false)}
                            className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                          >
                            Create
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {branches.filter(b => !b.isRemote).map((branch) => (
                    <div
                      key={branch.name}
                      className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          branch.isCurrent ? "bg-green-500" : "bg-white/20"
                        )} />
                        <div>
                          <p className={cn(
                            "font-mono text-sm",
                            branch.isCurrent ? "text-green-400" : "text-white"
                          )}>
                            {branch.name}
                          </p>
                          {branch.isCurrent && (
                            <span className="text-xs text-green-400/60">current</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!branch.isCurrent && (
                          <button
                            onClick={() => handleSwitchBranch(branch.name)}
                            className="px-2 py-1 text-xs text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors"
                          >
                            Checkout
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteBranch(branch.name)}
                          className="p-2 text-white/30 hover:text-red-400 transition-colors"
                          title="Delete branch"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Remote branches */}
                {branches.filter(b => b.isRemote).length > 0 && (
                  <>
                    <h3 className="text-sm text-white/40 mt-6 mb-2">Remote Branches</h3>
                    <div className="space-y-2">
                      {branches.filter(b => b.isRemote).map((branch) => (
                        <div
                          key={branch.name}
                          className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors opacity-60"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-white/20" />
                            <p className="font-mono text-sm text-white/60">{branch.name}</p>
                          </div>
                          <button
                            onClick={() => handleSwitchBranch(branch.name.replace("remotes/", ""))}
                            className="px-2 py-1 text-xs text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors"
                          >
                            Track
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Commits Tab */}
            {activeTab === "commits" && (
              <div>
                <h2 className="text-lg font-medium text-white mb-4">Recent Commits</h2>
                
                {selectedCommit && (
                  <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 overflow-auto py-8">
                    <div className="bg-[#1a1a1f] border border-white/10 rounded-xl w-full max-w-4xl mx-4">
                      <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <div>
                          <h3 className="text-white font-medium">{selectedCommit.message}</h3>
                          <p className="text-white/40 text-sm mt-1">
                            {selectedCommit.shortHash} by {selectedCommit.author}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedCommit(null)}
                          className="p-2 text-white/40 hover:text-white transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="p-4 max-h-[70vh] overflow-auto">
                        <pre className="font-mono text-sm text-white/70 whitespace-pre-wrap">
                          {commitDiff || "Loading diff..."}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {commits.map((commit) => (
                    <div
                      key={commit.hash}
                      className="flex items-start gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      onClick={() => handleViewCommit(commit)}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {commit.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{commit.message}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                          <span className="font-mono text-purple-400">{commit.shortHash}</span>
                          <span>{commit.author}</span>
                          <span>{formatDistanceToNow(new Date(commit.date), { addSuffix: true })}</span>
                          {commit.branch && (
                            <span className="px-1.5 py-0.5 bg-white/10 rounded">{commit.branch}</span>
                          )}
                        </div>
                      </div>
                      <button className="p-2 text-white/30 hover:text-white transition-colors flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
