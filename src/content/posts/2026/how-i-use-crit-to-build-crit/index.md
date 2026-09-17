---
title: 'How I use crit to build crit'
description: 'Dogfooding a code review tool through a planning-first AI workflow'
date: 'Mar 16 2026'
tags: ["ai-assisted-development"]
discussion: 5
---

![crit](./crit-preview.png)

I build [crit](https://github.com/tomasz-tomczyk/crit) - a local-first CLI for reviewing AI agent output with inline comments.

Years ago, Zach Holman gave a great talk called [How GitHub Uses GitHub to Build GitHub](https://zachholman.com/talk/how-github-uses-github-to-build-github/). It's a fantastic talk and one of my takeaways for me was <em>the way you work shapes what you build</em>. GitHub's async, PR-driven culture produced features that supported that culture. Same thing happened for me and the way I work with AI agents - plan first, review in rounds, iterate on feedback - ended up shaping what crit became.

The short version: I plan first, review the plan with crit, execute with agents, then review the git diff with crit before shipping. Every major feature goes through this.

## Step 1: Write the plan, not the code

I used to jump straight into implementation. "Add a way for the agent to know when I've finished reviewing" - and off Claude goes, writing code. The result was always _technically correct_ but architecturally questionable. It would make choices I'd disagree with, and by the time I noticed, we'd already built on top of those choices.

Now I start every feature with planning. I use the [superpowers plugin](https://github.com/obra/superpowers) which has a writing-plans skill. When I say "let's add auto-notification when the human finishes a review", Claude produces a comprehensive (maybe too much so) plan.

The markdown plan with clear sections is comprehensive: goals, constraints, architecture decisions, implementation steps. Reviewing long design specs as raw markdown in a terminal isn’t great though.

## Step 2: Review the plan with crit

Here's where the dogfooding kicks in. I run `/crit` and it opens the plan in my browser with full markdown rendering. I read through it like I'd review a design doc and leave inline comments directly on the plan.

The comments are specific, pointing to exact lines in the plan, and they challenge design decisions _before any code exists_. This is especially important for Crit, as I admittedly don't study the resulting Go code as much - but I catch important issues in the planning phase.

Having the whole plan rendered beautifully in the browser means it's easier to grasp, interpret code snippets and see how the whole thing fits together. It's actually _fun_ and reduces the mental overhead.

## Step 3: Agent addresses feedback

When I click "Finish Review", Claude picks up the comments automatically. It reads the comments and revises the plan. It then responds to the comments with a note explaining what changed, finally triggering a new review round. I see the diff between plan v1 and plan v2 right in the browser. I often do several rounds - refining the approach, challenging assumptions, tightening the scope - until I'm happy with the direction.

## Step 4: Execute the plan

Once the plan is approved, I start a fresh conversation for implementation. This might have been more important with older models, but the planning conversation can get long, and a clean context window means Claude focuses on executing rather than getting confused by earlier back-and-forth. The superpowers plugin has an executing-plans skill that works through the plan task by task. Claude writes the code, runs the tests, and moves through the steps methodically.

I'm not watching over its shoulder during this phase. The agent knows what to build, what patterns to follow, and what trade-offs we've agreed on. It's executing, and I can leave it be with more confidence than before while I do other things ☕.

## Step 5: Review the diff with crit

After implementation, I run `/crit` again. It auto-detects the git changes on the current branch and opens a full diff view - syntax-highlighted, file tree on the left with change counts, split or unified view.

![crit in diff mode](./diff-mode.png)

This is the second review pass, and it catches different things than the plan review:

- Implementation bugs the agent introduced
- Edge cases it didn't handle
- Code that technically satisfies the plan but in a clumsy way
- Test coverage gaps

I leave inline comments on the diff just like I did on the plan (admittedly I spend more time on this when it's Elixir rather than Go). Same workflow, same UI. Claude reads the comments, addresses the feedback, and we go another round if needed.

## The loop

So the full loop looks like this:

1. Agent writes implementation plan as markdown (superpowers writing-plans skill)
2. `/crit` - review the plan, leave inline comments
3. Agent revises plan, I review again until approved
4. Agent executes the plan step by step (fresh conversation)
5. `/crit` - review the git diff, leave inline comments
6. Agent addresses feedback, another round if needed
7. Ship

Every major feature of crit has gone through this loop. It's slower compared to "just vibe coding it" - but I stopped losing hours to reviewing AI slop and dealing with subtle bugs or inconsistencies - the outcomes are much higher quality.

---

Give [crit](https://github.com/tomasz-tomczyk/crit) a try - `brew install crit`. It works with any agent. And if you file an issue for it, well, I'll probably be reviewing the fix with crit.
