# AGENTS.md

## Purpose
- This repository is a Next.js 14 App Router application using TypeScript, MUI, Supabase, React Query, Redux Toolkit, Redux Persist, Zustand, React Hook Form, and Zod.
- Use this file as the working agreement for coding agents making changes in `/Users/maiki/dev/projects/rtl`.
- Prefer `npm` in this repo because `package-lock.json` is committed and `.npmrc` sets `legacy-peer-deps=true`.

## Rule Files
- No root `AGENTS.md` existed before this file.
- No `.cursorrules` file was found.
- No `.cursor/rules/` directory was found.
- No `.github/copilot-instructions.md` file was found.
- Do not assume extra editor-specific rules beyond what is documented here.

## Project Layout
- `src/app/` contains the App Router UI, layouts, pages, and route handlers under `src/app/api/**/route.ts`.
- `src/features/` contains newer feature-oriented code such as auth and catalog modules.
- `src/lib/` contains shared infrastructure, especially Supabase clients and React Query setup.
- `src/store/` contains the legacy Redux Toolkit store and slices.
- `src/stores/` contains Zustand stores for lighter UI state.
- `src/utils/` contains theme and utility modules.
- `types/supabase.ts` contains generated Supabase database types.
- `scripts/bootstrap-admin.mjs` bootstraps an admin user using Supabase service-role credentials.
- `supabase/` contains local Supabase config, migrations, and seed data.

## Install And Run
- Install dependencies with `npm install`.
- Start local development with `npm run dev`.
- Create a production build with `npm run build`.
- Start the production server with `npm run start`.
- Run lint with `npm run lint`.
- Bootstrap the default admin with `npm run bootstrap:admin` after env vars and migrations are ready.

## Test Status
- There is currently no `test` script in `package.json`.
- No Vitest, Jest, Playwright, Cypress, or `__tests__` directories were found.
- No `*.test.*` or `*.spec.*` files were found in the repo.
- That means there is no supported automated single-test command today.
- Do not invent `npm test` or single-test commands in automation unless you also add the missing test tooling.

## Single-Target Commands
- Lint the whole repo with `npm run lint`.
- Lint one file with `npx next lint --file src/app/layout.tsx`.
- Lint multiple files with repeated `--file` flags, for example `npx next lint --file src/app/layout.tsx --file src/features/catalog/catalog.api.ts`.
- Build the app with `npm run build` when you need type-aware production validation.
- There is no single-test command because there is no test runner configured.

## Environment Notes
- Copy values from `.env.example` into `.env.local` for local development.
- Required variables include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Admin bootstrap also expects `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, and optionally `BOOTSTRAP_ADMIN_FULL_NAME`.
- Supabase client helpers throw immediately when required env vars are missing; keep that fail-fast behavior.

## Stack-Specific Patterns
- App routing uses the Next.js App Router, not the Pages Router.
- Route handlers live in `src/app/api/**/route.ts` and return `NextResponse.json(...)`.
- Client-side forms use React Hook Form with `zodResolver(...)` and Zod schemas from feature modules.
- Server state uses TanStack React Query via `src/lib/react-query/provider.tsx`.
- Global legacy dashboard state still uses Redux Toolkit in `src/store/`.
- Lightweight UI state uses Zustand in `src/stores/`.
- Supabase access is split across browser, server, middleware, and admin helpers in `src/lib/supabase/`.

## TypeScript Rules
- `tsconfig.json` is strict; preserve `strict: true` compatibility.
- Path alias `@/*` maps to `src/*`; prefer it over long relative imports.
- Use explicit TypeScript types for API payloads, query responses, mutation options, and store state.
- Reuse generated database types from `types/supabase.ts` instead of re-declaring table shapes.
- Use `type` imports for purely type-level dependencies when practical.
- Prefer narrow unions and `z.infer<typeof schema>` over duplicated ad hoc form types.
- Avoid `any`; existing `any` in legacy code is not a precedent for new code.

## Import Conventions
- Follow the prevailing order: React/Next imports first, third-party packages next, internal `@/...` imports last.
- Keep type-only imports grouped and marked with `import type` where it improves clarity.
- Prefer absolute imports like `@/features/catalog/catalog.api` over deep relative paths.
- Use local relative imports only for nearby siblings such as `./query-client` or `./app`.
- Preserve existing named exports for shared hooks, queries, mutations, and components.
- Use default exports only where the codebase already expects them, especially Next.js `page.tsx`, `layout.tsx`, and some legacy components.

## Formatting Conventions
- Match the existing style: double quotes, semicolons, and trailing commas where valid.
- Prefer multi-line wrapping once props, object literals, or function parameters get dense.
- Keep JSX reasonably vertical and readable rather than aggressively compressed.
- Use blank lines to separate logical blocks, especially around hooks, derived values, and handlers.
- There is no Prettier config in the repo, so match surrounding file style closely when editing.
- ESLint only extends `next/core-web-vitals`; do not assume extra lint plugins are available.

## Naming Conventions
- React components use PascalCase file names and PascalCase component names, for example `ProductsList.tsx` and `AdminUserCreateForm.tsx`.
- Hooks use camelCase names starting with `use`, for example `useProductsQuery`, `useCreateAdminUserMutation`, and `useUiStore`.
- Zustand stores are named `use-*-store.ts` at the file level and `useXStore` in code.
- Query key constants are exported as lower camel case ending in `QueryKey`.
- Zod schemas are typically named `createXSchema`, `updateXSchema`, or `xSchema`.
- API response types use descriptive PascalCase names ending in `Response`.
- Booleans usually read as `isX`, `hasX`, or `shouldX`.
- Route handlers must export uppercase HTTP method functions like `GET`, `POST`, and `PUT`.

## React And UI Guidelines
- Mark client components explicitly with `"use client"` when they use hooks, browser APIs, Zustand, Redux, or form libraries.
- Prefer functional components and hooks; no class components were found.
- Derive simple UI state near the top of the component from query results and local state.
- Keep presentation and feature logic separated when the repo already has a feature module for that area.
- Use MUI components and the existing theme utilities instead of introducing a second UI system.
- Follow the current UX pattern of showing loading, error, empty, and success states explicitly.
- For forms, wire MUI inputs through `register(...)` or `Controller` depending on the component API.

## Data Fetching Guidelines
- Put fetch wrappers in feature-level `*.api.ts` files.
- Centralize response parsing in small helpers like `parseApiResponse<T>(response)`.
- Throw `Error` from client fetch wrappers when `response.ok` is false so React Query can surface failures.
- Put query hooks in `*.queries.ts` and mutation hooks in `*.mutations.ts`.
- Invalidate the minimal relevant query keys on mutation success.
- Keep React Query keys stable and exported from the same feature module that owns the data.

## Validation Guidelines
- Validate request bodies in route handlers with `schema.safeParse(payload)`.
- Return `400` with a consistent `{ message, errors }` payload for invalid input.
- Share schemas between forms and API handlers when possible.
- Normalize incoming payloads before validation when the UI may omit optional arrays or files.

## Error Handling Guidelines
- Fail fast for missing required environment variables in shared setup code.
- In route handlers, prefer returning `NextResponse.json({ message }, { status })` over throwing.
- In client API wrappers, prefer throwing `Error` with a user-facing message.
- In forms, surface mutation errors with MUI `Alert` components and preserve server messages when useful.
- Catch around multi-step client actions when one step can fail before the mutation, such as file upload before save.
- Use specific HTTP statuses when the code already distinguishes them, especially `400`, `401`, `403`, `404`, `409`, and `500`.

## Supabase Guidelines
- Use `createClient()` from `src/lib/supabase/client.ts` in browser code.
- Use `createClient()` from `src/lib/supabase/server.ts` in server components and auth helpers.
- Use `createAdminClient()` only in server-side privileged code such as route handlers or scripts.
- Preserve typed table access and RPC usage through the generated `Database` type where possible.
- Keep service-role access out of client components.

## Auth Guidelines
- Reuse `getAuthContext`, `requireAuth`, and `requireAdmin` from `src/lib/auth.ts` instead of duplicating auth checks.
- Middleware currently redirects unauthenticated users to `/auth/login` and preserves `redirectTo`; maintain that behavior.
- Keep public-route exceptions centralized in `middleware.ts`.

## Legacy Code Considerations
- This repo mixes newer feature-oriented code with older template-style dashboard code.
- Prefer the newer `src/features/*` patterns for net-new work.
- Avoid broad refactors of legacy Redux or dashboard files unless the task requires it.
- When editing older files with inconsistent formatting, improve only the touched area unless doing a deliberate cleanup.

## Agent Workflow Expectations
- Before changing a feature, inspect the nearest feature module for existing schemas, API wrappers, query keys, and mutation hooks.
- Prefer minimal, local changes that fit existing structure over introducing new abstractions.
- If you add tests in the future, also add documented `npm` scripts and update this file with single-test commands.
- When you add a new repo-wide rule or workflow, update `AGENTS.md` in the same change.
