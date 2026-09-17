# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED
Any Bash command containing `curl` or `wget` is intercepted and replaced with an error message. Do NOT retry.
Instead use:
- `ctx_fetch_and_index(url, source)` to fetch and index web pages
- `ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED
Any Bash command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` is intercepted and replaced with an error message. Do NOT retry with Bash.
Instead use:
- `ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### WebFetch — BLOCKED
WebFetch calls are denied entirely. The URL is extracted and you are told to use `ctx_fetch_and_index` instead.
Instead use:
- `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Bash (>20 lines output)
Bash is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### Read (for analysis)
If you are reading a file to **Edit** it → Read is correct (Edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `ctx_execute_file(path, language, code)` instead. Only your printed summary enters context. The raw file content stays in the sandbox.

### Grep (large results)
Grep results can flood context. Use `ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `ctx_execute(language, code)` | `ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Subagent routing

When spawning subagents (Agent/Task tool), the routing block is automatically injected into their prompt. Bash-type subagents are upgraded to general-purpose so they have access to MCP tools. You do NOT need to manually instruct subagents about context-mode.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `ctx_search(source: "label")` later.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `ctx_stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `ctx_doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `ctx_upgrade` MCP tool, run the returned shell command, display as checklist |

---

# Working on this site

## Pressmark

The theme is a separate repo at `../pressmark`, published as `@pressmark/theme`
and `@pressmark/astro`. Its design rules live in `../pressmark/CLAUDE.md` — read
that before changing anything under `../pressmark`, not this file.

`package.json` pins the published range. To build against the local checkout:

```
pnpm pressmark:local    # ../pressmark, edits are live
pnpm pressmark:npm      # back to the published packages
```

**After switching modes, or after any edit under `../pressmark`, clear caches:**

```
rm -rf .astro node_modules/.vite && pnpm dev
```

Skipping this is the most common way to waste an hour here. The dev server keeps
serving the previous markdown render and CSS, so a correct change looks like it
did nothing. Before concluding a change failed, check *what you are looking at*:
diff the served HTML against a fresh `pnpm build` in `dist/`.

`pnpm install` will not repair a `node_modules/@pressmark/*` link you replaced —
it compares the lockfile against its own state and never inspects `node_modules`,
so it reports "Already up to date" with the packages missing. Use `pnpm pressmark:npm`.

Changing Pressmark means releasing it: commit, push, `gh release create vX.Y.Z`
(the release Action publishes both packages with provenance), then bump the range
here. Packages published in the last 24h need `@pressmark/*` in
`minimumReleaseAgeExclude` — it is already there.

## Build-time guards

`astro build` fails by design on:

- a per-post `theme:` block whose text roles are unreadable on their background
  (`src/lib/postTheme.ts` — code roles are judged on `raised`, page text on `surface`)
- two tags that slug to the same URL (`src/lib/utils.ts`)

Both exist because frontmatter is free-form. Fix the frontmatter; do not loosen
the guard. `pnpm test` runs their unit tests — plain `node --experimental-strip-types`,
no framework.

## Editing files with non-ASCII characters

Posts and components are full of em-dashes, arrows and `✦`. `perl -pi` without
`-CSD` reads and writes bytes and silently mangles any line it rewrites that
contains one; zsh's `echo` expands `\n` into a real newline, which breaks JSON on
stdin. Use `python3` with explicit `encoding='utf-8'` for scripted edits, or a
CSS escape (`content: "\2022"`) where the file format allows it.

## Comments

A comment earns its place only if it is still useful a year from now, to
someone who never saw the conversation that produced it. Write what is true of
the code as it stands.

- Explain the constraint, the gotcha, or the non-obvious mechanism — the thing
  the code cannot say about itself.
- No history: no "this replaces", "we used to", "before this prop existed",
  "what changed in 0.4.0", no narration of a rejected alternative or of the
  review that led here. That belongs in the commit message.
- No design-review prose. One sentence on why a value is load-bearing beats a
  paragraph defending it.
- Don't restate the code, and don't leave TODOs addressed to a person about
  work from a past session.

When editing a file, fix the comments around your change to match this. When a
comment above the code you touched narrates a past decision, delete it rather
than adding a second one below it.
