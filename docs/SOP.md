---
title: SOP - HydraaZone Redesign (Backend-First Build)
client_budget: $85
base_codebase: Sultan Bazar (Next.js + MERN)
---

# SOP: HydraaZone E-commerce Redesign

## Goal

Redesign HydraaZone (www.hydraazone.com) as a basic but complete e-commerce store, backend-first, reusing the existing Sultan Bazar server codebase as the starting point instead of building from zero. Budget is $85, so scope discipline matters more than feature completeness. Deliver a working, secure, COD-only store that matches the client's 13-point requirement list.

## Tools and setup

- IDE: Cursor + Claude Code (in-editor AI assistance for implementation)
- Base code: old Sultan Bazar server (Node.js/Express + MongoDB, per your existing stack)
- Version control: keep this as its own git repo/branch, never build directly on top of the live Sultan Bazar production code, copy it into a fresh directory first
- Planning docs: this SOP + the PRD (server-prd-hydraazone.md), both live alongside the code so Claude Code can reference them directly during implementation

## Step-by-step workflow

1. **Codebase placement.** Copy the Sultan Bazar server code into a fresh project directory (not the live Sultan Bazar repo). This becomes the working base for HydraaZone.
2. **Codebase audit against PRD.** Before writing a single new line, have Claude Code read the placed codebase and compare it feature-by-feature against the PRD. Output: a gap list, what already exists and can be reused as-is, what exists but needs modification, what is completely missing.
3. **Review the gap list with yourself before coding starts.** Confirm the gap list matches your own understanding of the Sultan Bazar code before implementation begins, this avoids Claude Code guessing at structure it hasn't actually verified.
4. **Build in phases, not all at once.** Follow the phase order in the PRD (Phase 1: storefront + cart + checkout + COD, Phase 2: accounts + admin, Phase 3: marketing/SEO/reviews). Each phase should be independently testable and demoable.
5. **Preserve existing code conventions.** Folder structure, naming, response shape, error handling pattern, all stay exactly as Sultan Bazar already does them. Do not introduce a new pattern, library, or architecture choice mid-project without a specific reason, consistency across your projects is part of your own portfolio quality bar.
6. **Test each feature before moving to the next.** A feature is not "done" until it has been manually run end to end (e.g. add to cart -> checkout -> COD order created -> visible in admin panel), not just written.
7. **Track progress against the PRD checklist**, not against vague memory of what's been done. At the end of each work session, mark off what shipped in the PRD's checklist section.
8. **Client handoff.** Before marking the order complete: run through the full PRD checklist once as the client would use the site, prepare a short handover note (admin login instructions, what's included vs what's future scope), and ask for a review/testimonial on delivery, this is your first Upwork-adjacent order and a strong review compounds into future work.

## Definition of done (per feature)

A feature counts as done only when: it works end to end in the browser (not just an API test), it matches the PRD's acceptance line for that feature, it follows the existing Sultan Bazar code style, and it does not break any previously-completed feature.

## Scope discipline (important at this price point)

At $85 for 13 requirement areas, some items are naturally heavier than others (photo review moderation, Conversion API server-side events, full SEO tooling). The PRD flags these as Phase 3 / stretch items. If time runs short, ship a complete, working Phase 1 + 2 over a half-finished Phase 3, a smaller complete store beats a bigger broken one for both the client relationship and your own review.

## Communication

Respond to any client message the same day. If a requirement is ambiguous (e.g. "basic Admin Panel" could mean a lot of things), ask the client directly rather than guessing and rebuilding later.
