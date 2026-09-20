# GitHub Player Rating ⚽

Turn any GitHub profile into a football-player-style rating card — like opening a FIFA/EA FC pack, but the stats come from your commits, not your crosses.

**🔗 Live:** [git-player.vercel.app](https://git-player.vercel.app)

---

## Table of Contents

- [Overview](#overview)
- [Demo](#demo)
- [Features](#features)
- [How the Rating Is Calculated](#how-the-rating-is-calculated)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Getting Started Locally](#getting-started-locally)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Disclaimer](#disclaimer)
- [Author](#author)

---

## Overview

**GitHub Player Rating** analyzes a public GitHub profile — repositories, commit activity, contribution history, collaboration signals, and technology stack — and converts it into a football-player-style rating card, complete with an overall rating (OVR), six FIFA-style attributes, an algorithmically-assigned position, and a full analytics breakdown explaining exactly how the score was calculated.

It's built as a full-stack portfolio project demonstrating:
- REST + GraphQL API integration (GitHub's API)
- A transparent, weighted, normalized scoring algorithm (not just "more stars = higher score")
- Serverless backend architecture on Vercel
- A polished, animated, data-driven frontend

## Demo

| | |
|---|---|
| **Live app** | https://git-player.vercel.app |
| **Try it** | Search any public GitHub username, or compare two side by side |

> Add screenshots/GIFs here once you have them — a screenshot of the player card and the score breakdown panel sell this project instantly on GitHub and LinkedIn.

## Features

### 🎴 Player Card
- Overall rating (OVR) out of 100
- Six football attributes: **PAC** (Development Speed) · **SHO** (Project Execution) · **PAS** (Collaboration) · **DRI** (Technical Versatility) · **DEF** (Code Discipline) · **PHY** (Developer Consistency)
- Algorithmically-assigned position (ST, CAM, CM, CDM, CB, LW/RW, GK) based on actual tech-stack signals, not randomness
- Developer tier, from **Rookie** to **Legendary**

### 📊 Analytics
- Full score breakdown — see exactly how many points each category contributed
- Activity graph: active days, current streak, longest streak, contributions
- Language distribution chart
- Top-repository ranking by engagement (stars, forks, recency)
- Data-backed strengths & areas-to-improve — generated from actual metrics, never generic filler

### ⚔️ Compare
- Head-to-head comparison between two GitHub users
- Category-by-category attribute breakdown with a clear winner

### 🛡️ Honest by design
- Every score is explainable — no black-box numbers
- Clearly labels estimated data (e.g., activity estimated from public events when no auth token narrows it down)
- Visible disclaimer: this is an independent scoring system, not an official GitHub metric

## How the Rating Is Calculated

The OVR is a weighted combination of six normalized categories:

| Category | Weight | Signals |
|---|---|---|
| Activity | 25% | Commit frequency, active days, recent pushes, contribution volume |
| Projects | 20% | Meaningful repo count, active ratio, documentation, topics, releases |
| Open Source | 15% | Pull requests, reviews, issues, external contributions |
| Popularity | 15% | Stars, followers, forks, watchers |
| Consistency | 15% | Contribution streaks, account longevity, active-day spread |
| Technical Diversity | 10% | Language count, language balance, topic diversity |

**Design principles:**
- **Log-scale normalization** — going from 10,000 to 20,000 stars barely moves the needle compared to going from 0 to 50. Large accounts don't automatically dwarf smaller, high-quality ones.
- **Quality over quantity** — a developer with fewer, well-documented, active repos can outscore someone with hundreds of abandoned ones.
- **No black boxes** — every attribute and the final OVR trace back to a visible breakdown in the UI.

Category weights and attribute mixes are centralized in one config file, so the whole algorithm can be tuned without touching calculation logic.

## Tech Stack

**Frontend**
- React + TypeScript + Vite
- Tailwind CSS
- Framer Motion (animations)
- Recharts (radar / bar charts)
- React Router

**Backend**
- TypeScript on Vercel Serverless Functions
- GitHub REST API + GraphQL API (contribution calendar)
- In-memory TTL caching

**Deployment**
- Vercel (single project — frontend + API together, same domain)

## Architecture

```
┌─────────────────────┐        ┌──────────────────────────┐        ┌────────────────┐
│   React frontend     │──────▶│  Vercel serverless API    │──────▶│   GitHub API     │
│  (search, card, UI)  │◀──────│  /api/health               │◀──────│  REST + GraphQL  │
└─────────────────────┘        │  /api/player               │        └────────────────┘
                                │  /api/compare               │
                                │        │                    │
                                │        ▼                    │
                                │  Scoring engine:             │
                                │  metrics → categories →      │
                                │  attributes → OVR → tier →    │
                                │  position → insights          │
                                └──────────────────────────┘
```

## Project Structure

```
api/              Vercel serverless entrypoints (thin — health, player, compare)
server/src/       Actual backend logic, kept out of /api on purpose
  ├─ github/        REST + GraphQL client, concurrent fetch orchestration
  ├─ scoring/        Metrics extraction, normalization, category scores,
  │                   attributes, OVR, position algorithm, tiers, insights
  ├─ cache/          In-memory TTL cache
  └─ httpx/          Shared response helpers, validation, error handling
frontend/         React + Vite + TypeScript UI
```

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/player?username=<name>` | GET | Full rating + analytics for one GitHub user |
| `/api/compare?a=<name>&b=<name>` | GET | Head-to-head comparison of two users |

Every error response follows the same shape:
```json
{ "error": "user_not_found", "message": "no GitHub user found for \"...\"" }
```

## Getting Started Locally

```bash
git clone https://github.com/<your-username>/github-player-rating.git
cd github-player-rating

# Backend
npm install
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx   # optional but recommended — raises the GitHub API
                                         # rate limit from 60/hr to 5000/hr and enables the
                                         # real contribution-calendar data
npm run dev:api                          # http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                              # http://localhost:5173
```

## Deployment

Deployed as a single Vercel project — the same `vercel.json` builds the React frontend and turns each file in `/api` into an independent serverless function. Set `GITHUB_TOKEN` as an environment variable in the Vercel dashboard before deploying.

## Known Limitations

- GitHub's public REST API only exposes ~90 days of event history; without an authenticated token, streak/contribution numbers fall back to a clearly-labeled estimate.
- "Merged PRs" are approximated from pull-request event actions, since the public events API doesn't distinguish a merge from a close-without-merge.
- No persistent database — the leaderboard/history features from the original spec are a documented future extension, not yet built.
- The in-memory cache resets on cold start (expected for a serverless demo project).

## Roadmap

- [ ] Persistent leaderboard (Vercel KV / Postgres)
- [ ] Shareable/exportable player card image
- [ ] Org-level team ratings
- [ ] Historical rating trend over time

## Disclaimer

GitHub Player Rating is an independent scoring system based on publicly available GitHub data. It is **not affiliated with or endorsed by GitHub, Inc.**

## Author

**Ishan Das**
3rd-year B.Tech CSE, KIIT University
- GitHub: [@ishandas994-cloud](https://github.com/ishandas994-cloud)
- LinkedIn: [ishan-das](https://linkedin.com/in/ishan-das-13765b322)
- Email: ishandas994@gmail.com

If you found this project interesting, a ⭐ on the repo goes a long way.