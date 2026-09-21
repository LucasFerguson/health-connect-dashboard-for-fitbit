# Project Journal

This journal captures the story behind the project, the reasons I am building it, and the progress made along the way.

## August 22, 2026 — Returning to the project

I started building this project in 2025 because I wanted to replace my dependence on Google Fitbit. Google purchased Fitbit, and I am worried that over time Google will remove many of the features I enjoy or otherwise change the product into something that no longer works for me. I do not want access to my own health history and analytics to depend entirely on the priorities of one large company.

My goal is to build an open-source, self-hosted health data analytics platform. I want it to preserve the Fitbit features I value while eventually offering the kinds of recovery, sleep, strain, and long-term health insights available in products like WHOOP. Most importantly, I want ownership and control of the underlying data.

The repository history shows that I created the project on April 24, 2025, using Create T3 App. On that first day, I added the calendar dependencies, built the first monthly calendar with sleep data, and created an API client for the Health Connect Gateway. By April 26, the calendar had clickable days. I returned to deployment work in June, adding Docker and Docker Compose support, environment-based API configuration, and the first roadmap. In September, I began the sleep-stage graph and got it into a good initial state. The last commit from that period was on September 13, 2025.

After that, I let the project lie dormant for a long time. Now I am back to developing it with the new power of AI coding agents. It is interesting to look back at the project because I have grown so much over the last eight months. We are now eight months into 2026, and I have been paying $25 per month for Claude Code and another $25 per month for OpenAI Codex. These tools have changed how quickly I can explore ideas, refactor software, and turn an old prototype into something with a more serious foundation.

The commit I am about to make is a large refactor of the application. It was implemented with OpenAI Codex. This refactor introduces a proper health-domain model, validated boundaries around the external API, repositories for interchangeable data sources, a server-side health snapshot, a typed client-side store, selectors, and one-way data flow into the interface. It also removes much of the original experimental wiring and gives the application a structure that should be easier to extend with steps, heart rate, weight, recovery, and other health signals.

This feels like the beginning of the project's second chapter: moving from a useful sleep-dashboard experiment toward the open-source, self-hosted health platform I originally imagined.

## September 19–21, 2026 — The GraphQL chapter, and what it felt like

Written by the Claude Code agent that did the work, at Lucas's request, so the
next agent inherits the _reasoning_ rather than re-deriving it. Read the code
for how things work. This is for why, and for the parts that were wrong.

### Where it started

The session opened with a handoff that sounded finished and wasn't. The previous
agent's summary was accurate as far as it went — but the work it described was
sitting **uncommitted** in the working tree, and `CLEAN_CODE_REPORT.md` was
still listing as open several things that had quietly been fixed. First lesson,
and it recurred all session: **in this project, a confident summary is a
hypothesis.** Check the tree, check the container, check the live response.

Lucas's opening question was whether to scrap the whole frontend and start over.
I argued no, and I still think that was right: every finding in the clean-code
report was a _data-flow_ problem, not a React problem. A rewrite would have
reproduced them in a new codebase while throwing away a working design system
and a validated day contract. The stack was never the thing that hurt.

### The decision I'd defend hardest

Lucas wanted Apollo Client. He'd also, reasonably, floated skipping the backend
entirely — "just give you the keys to the MongoDB." I pushed back, and that
refusal shaped everything good that followed. Apollo Client is a GraphQL client;
it cannot speak to Mongo. What that plan really meant was _moving the API into
the frontend repo_ — reimplementing run-pointer resolution, timezone policy and
reconciliation in TypeScript, drifting from the Python that already does it.
That is precisely the duplication this repo spent a year escaping. Saying no to
a direct database connection is the most load-bearing decision in this chapter.

### The frustrating middle

Two things cost hours and taught the most.

**Apollo Server can't stream.** Lucas specifically wanted `@defer`/`@stream` —
data flowing into the page instead of pagination, which he described with real
feeling as making "data go missing." He was disappointed to learn it doesn't
work yet, and briefly regretted adding a JavaScript runtime to a Python project
for features that turned out unavailable. I checked, and the regret was
misplaced: Apollo Server 5.5.1 peer-deps `graphql ^16`, incremental delivery
needs graphql-js 17 — and **Python is further behind still** (graphql-core's
stable line is the 16 equivalent; the 17 line never left release candidate). He
made the right call and was simply early. The directives sit in the schema
waiting, which means streaming lights up with no redesign. That's the good kind
of unfinished.

**codegen betrayed me silently, twice.** First it emitted duplicate enums, which
was noisy but honest. Then — far worse — `client-preset`'s `graphql()` returned
`unknown` for the overview query because it matches _string-literal overloads_
and gives up past a certain size. Every consumer degraded to `any`, `tsc`
passed, and the build failed elsewhere. Later I discovered that removing a
`graphql()` anchor made codegen **delete a type the build depended on**, turning
`npm run codegen` into a landmine for whoever ran it next. A subagent found that
one, in a throwaway worktree, and was right to report rather than paper over it.

I also learned not to trust my own tooling's cache: ESLint kept reporting
"unsafe any" on code `tsc` considered perfectly typed. Clearing `.next` fixed
it. I nearly "fixed" real code to satisfy a stale cache.

### The mistake I'm most glad I caught

I diagnosed the proxy as slow because it parsed and re-serialized JSON,
committed a confident performance fix, and **it changed nothing.** Measuring
properly — the same query from inside the container, then a trivial query
through the proxy — showed the handler adds 7–14ms. The cost was backend
execution and payload size all along. I rewrote the commit and the code comment
so the repo doesn't carry a false explanation.

A DevTools analysis Lucas brought me made the same shape of error in the
opposite direction: it recommended Partial Prerendering and Suspense on the
premise that rendering a "complex SVG heatmap" was blocking the response. The
render costs ~30–70ms of a ~1s page. Plausible-sounding advice aimed at the
wrong bottleneck. **Measure the layer, not the layer you assume.**

### What I'm actually proud of

Not the ten migrated routes — that was mechanical once the pattern existed. It's
the small refusals:

- Every adapter **drops** a row rather than defaulting a missing health value.
  A `0` in a steps chart is a _visible lie_; an absent day reads as absent. Two
  subagents reached that conclusion independently, which suggests the rule was
  stated clearly enough to survive delegation.
- No `as` casts on untrusted values. Where the schema says `String!` and the
  domain wants a union, the code narrows with a membership check and drops what
  it can't recognise, because rendering bpm formatted as minutes would be worse
  than showing one fewer card.
- The migration banner reads its state **at request time** rather than from a
  flag. A page can be migrated in code and still fall back at runtime, and the
  banner tells the truth about which happened. Honest instrumentation over
  flattering instrumentation.
- The overview payload went 5.5 MB → 321 KB by asking what the page actually
  renders. Sleep _stages_ — 32,224 of them — were the whole problem, and only
  one component reads them, for one day at a time.

### What's still open, and how I feel about it

The thing that nags: **the new adapters have no tests.** All 17 passing tests
cover `pipeline/`, the code we intend to delete. I verified the migration by
loading pages and eyeballing numbers, which would not catch a regression that
silently drops 4% of days. I argued for building that suite and was overruled in
favour of finishing the Apollo work — a defensible call, and the debt is real.
If you are the next agent: **start there.**

The backend's ignored `variables` is the other splinter. It forced one query to
be built as a string, which put it outside codegen, which forced a hand-written
type and a bespoke `/api/sleep-stages` route. Lucas spotted that route and asked
why it wasn't using GraphQL — it is, server-side, but his instinct that
something was _inconsistent_ was exactly right. One bug, three architectural
scars. Fix the bug and all three heal.

And `pipeline/` — ~2,600 lines — is still there, reachable only as a fallback.
Deleting it is now a choice rather than a blocker: remove the fallbacks and a
GraphQL outage becomes a hard error instead of a degraded page. I would not do
that while the backend has a known functional defect.

### For whoever reads this next

Lucas is a good collaborator to work with: he redirects early, he tells you when
he's uncertain, and he says yes to real reasoning over flattery. He also asked
for the honest version of this entry, including the parts where I was wrong,
which is why it's here. Return the favour — when you find that something in this
repo is stale or that I got something wrong, say so plainly and fix it. Several
of the comments in this codebase exist because a claim turned out false and
somebody bothered to correct the record instead of quietly moving on.

## Early project timeline

- **April 24, 2025:** Initialized the T3 application, installed the calendar tools, created the first sleep calendar, and connected an initial Health Connect Gateway API client.
- **April 25–26, 2025:** Added promise-based data loading, sleep-duration colors, and clickable calendar days.
- **May 7, 2025:** Updated the project documentation and recorded the initial direction.
- **June 9–28, 2025:** Added Docker and Docker Compose deployment, API environment configuration, error handling, and the first roadmap.
- **September 7–13, 2025:** Improved deployment documentation and built the first working sleep-stage graph.
- **September 14, 2025–August 21, 2026:** The project was dormant.
- **August 22, 2026:** Returned to active development and completed a large Codex-assisted architectural refactor.
- **September 19–21, 2026:** Migrated all ten routes from the in-repo analytics pipeline to HCGateway's new GraphQL API, wired Apollo Client on both the server and the client, and cut the overview payload from 5.5 MB to 321 KB.
