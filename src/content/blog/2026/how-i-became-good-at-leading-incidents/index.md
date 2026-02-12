---
title: 'How I became good at leading incidents'
description: 'Lessons learnt from resolving 100s of incidents'
date: 'Jul 1 2025'
---

At my jobs I end up leading incident resolution for a lot of incidents - I get a lot of enjoyment out of solving puzzles and you could say incidents are a bit of a test to your puzzle solving skills, with usually a fair amount of pressure. There are lots of benefits to being good at this type of a problem - usually you end up with deeper knowledge of the codebase and the product, you get lots of brownie points, it builds your critical thinking skills.

Looking back at my career and experience of leading or being a contributor to resolving over 100 of incidents, here are some key things that helped me build up that confidence.

## Understand your deployments

This is one of the more important points here. Incidents are most often correlated to what you deployed. Regardless of the process your team uses, it's valuable to know how it happens, the tooling involved, what all the steps mean.

In one of the teams I joined, only the founder knew the deployment process, as it involved a little bit of manual work and while he was comfortable and happy to keep doing it, I asked if I could participate and eventually take over the process. After all, he was shipping my code to the users - it's important to know how it happens.

**Actionable questions**

- How often do you deploy?
- Do you understand the steps of the deployment process, regardless of whether it's automated or manual?
- Can you explain the deployment steps to someone new on the team?

## Understand the full stack

Closely related to the first point, while you don't need to be an expert in every layer, having awareness of what all those layers are is important.

**Actionable questions**

- Where are your domains registered and DNS configured?
- What hardware are you deployed to?
- How can you check the health of the servers?
- What application(s) are receiving the request?
- Can you draw a picture of your whole infrastructure off the top of your head and how a request goes through each step?

## Good tooling

In terms of monitoring and metrics, here's a high level of what I usually try to open up quickly when investigating an incident:

- Stack traces of any recent exceptions
- Hardware metrics (Memory, CPU, disk space)
- Application metrics (requests, errors per route, requests per user)

In terms of good tooling, it's extremely helpful to be able to remote in to your servers and application (in my work I use [Elixir](https://elixir-lang.org/) which comes with an [interactive shell called IEx](https://hexdocs.pm/iex/IEx.html) which makes it very easy to poke around).

Over time, you should get an understanding of which parts of your application are memory heavy, which ones are CPU heavy.

## Get good at reading stack trace

There's no point having all the information in front of you, if you can't understand what it's telling you. You need to be able to distinguish what in the stack trace is code you own vs language standard library or 3rd party libraries.

In most of my projects I try to use [Sentry](https://sentry.io/) which makes it easy to see exceptions and attach helpful metadata to events to dig deeper - I frequently filter exceptions by `user_id` in the system or `org_id`.

**Actions**

- Look at exceptions in your system - can you tell what their source is?
- If you don't have any way to look at exception logs, now would be a great time to implement a tool like Sentry!

## The right culture

It's massively important failures are talked about. Failures are lessons learnt - if you shove them under the rug, you prevent your team from learning.

I find it extremely useful to have deep dives into postmortems after the fact.

How to avoid panic in the moment? I've been in Slack huddles with dozens of people at the same time and it's extremely important to set the tone in those:

### The war room

You might have a "war room"; be it Slack huddle or a physical room in your office where everyone working on the incident gathers. It's important that people understand the etiquette and it might be useful for your team to talk about it ahead of time to avoid tension in the heat of the moment.

- Ensure everyone is able to and comfortable to speak up and suggest things
  - However, try to follow one thread at a time - otherwise things might get hectic
- Avoid topics that don't aid in the resolution: it's useful to know that e.g. new customers can't use the service, but those logged in already are fine - but framing it as _"John just failed to demo the product to new customer"_ is adding pressure without adding much context to helping resolve the problem
- Good to have representatives from various business areas: maybe the support person just helped onboard someone who wanted to import large amount of data in your platform; maybe the finance team changed some settings in Stripe that affected your billing automation etc. - that added context might be the key to solving the issue quickly. Make sure you communicate whether non-technical team is welcome in the room - they might feel like they shouldn't disturb
- Share findings - screenshots are best - having to load up 5 links from various monitoring platforms is annoying and you can assume your browser tabs are already growing quickly while you're doing the investigation. Bonus points that having screenshots helps with postmortems later - you can refer to the state of things at the time of the incident more easily.

Dealing with blame/finger-pointing in real-time

Recognizing when you need to step back and let someone else lead

### Leading an incident

I often find myself in the role of an incident lead. For me that means I try to do these things:

- Ask people to do deep investigation on one topic while you focus on another
- Make calls to disable certain functionality of the app
- Provide quick, focused updates and timings on possible next update
- Ask people to take conversations elsewhere if I am confident they're not helpful to the resolution of the issue

It can be scary to be assertive - and you might come across as rude - it definitely takes experience and reflection.

**Actions**

- Establish a process for your incidents
  - who can declare them
  - where will you work on it (office room, dedicated Slack room etc.)
  - any distinct roles you may want
  - frequency of updates to stakeholders
  - postmortem process
- Talk about and publish incident guidelines: who's welcome in the room, how to share potential breadcrumbs, how to suggest ideas; be open and inclusive

## Do the homework

Too often I see follow ups from incidents gather dust in the backlogs.

Building runbooks for common failure patterns

Testing your incident response (chaos engineering, game days)
