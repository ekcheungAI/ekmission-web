# ekmission

Command center for managing AI agents, git workflows, and multi-device sync across your ekOS environment.

## Features

- **Agent Management** — Spawn and manage AI agents with skill routing
- **Git Dashboard** — Visual git status, branch management, and commit history
- **Sync Monitor** — Track ekOS dotfiles sync status across all your machines
- **Machine Registry** — SSH terminal access to registered machines via Tailscale
- **MCP Integration** — Built-in support for Vercel and Cloudflare MCP servers
- **Task Queue** — Track and manage async agent tasks

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4
- **State**: Zustand + TanStack Query
- **Terminal**: xterm.js
- **SSH**: node-ssh / ssh2
- **MCP**: @modelcontextprotocol/sdk
- **Validation**: Zod 4

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
src/
├── app/              App Router pages
│   ├── actions/      Server actions
│   ├── agents/       Agent management UI
│   ├── api/          API routes
│   ├── git/          Git operations
│   ├── login/        Auth
│   ├── machines/     Machine registry
│   ├── monitor/      System monitoring
│   ├── projects/     Project list
│   ├── sync/         ekOS sync dashboard
│   └── tasks/        Task queue
├── components/       Shared UI components
│   ├── auth/         Auth provider
│   └── terminal/     SSH terminal
├── lib/
│   ├── agents/       Agent spawning logic
│   └── ssh/          SSH session management
├── store/            Zustand stores
├── types/            Shared TypeScript types
└── proxy.ts          MCP proxy
```

## Environment Variables

```env
AUTH_PASSWORD=        # Password for dashboard access
TAILSCALE_AUTH_KEY=  # Tailscale auth key for machine discovery
```
