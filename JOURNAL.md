# Project Journal

This journal captures the story behind the project, the reasons I am building it, and the progress made along the way.

## August 22, 2026 — Returning to the project

I started building this project in 2025 because I wanted to replace my dependence on Google Fitbit. Google purchased Fitbit, and I am worried that over time Google will remove many of the features I enjoy or otherwise change the product into something that no longer works for me. I do not want access to my own health history and analytics to depend entirely on the priorities of one large company.

My goal is to build an open-source, self-hosted health data analytics platform. I want it to preserve the Fitbit features I value while eventually offering the kinds of recovery, sleep, strain, and long-term health insights available in products like WHOOP. Most importantly, I want ownership and control of the underlying data.

The repository history shows that I created the project on April 24, 2025, using Create T3 App. On that first day, I added the calendar dependencies, built the first monthly calendar with sleep data, and created an API client for the Health Connect Gateway. By April 26, the calendar had clickable days. I returned to deployment work in June, adding Docker and Docker Compose support, environment-based API configuration, and the first roadmap. In September, I began the sleep-stage graph and got it into a good initial state. The last commit from that period was on September 13, 2025.

After that, I let the project lie dormant for a long time. Now I am back to developing it with the new power of AI coding agents. It is interesting to look back at the project because I have grown so much over the last eight months. We are now eight months into 2026, and I have been paying $25 per month for Claude Code and another $25 per month for OpenAI Codex. These tools have changed how quickly I can explore ideas, refactor software, and turn an old prototype into something with a more serious foundation.

The commit I am about to make is a large refactor of the application. It was implemented with OpenAI Codex. This refactor introduces a proper health-domain model, validated boundaries around the external API, repositories for interchangeable data sources, a server-side health snapshot, a typed client-side store, selectors, and one-way data flow into the interface. It also removes much of the original experimental wiring and gives the application a structure that should be easier to extend with steps, heart rate, weight, recovery, and other health signals.

This feels like the beginning of the project's second chapter: moving from a useful sleep-dashboard experiment toward the open-source, self-hosted health platform I originally imagined.

## Early project timeline

- **April 24, 2025:** Initialized the T3 application, installed the calendar tools, created the first sleep calendar, and connected an initial Health Connect Gateway API client.
- **April 25–26, 2025:** Added promise-based data loading, sleep-duration colors, and clickable calendar days.
- **May 7, 2025:** Updated the project documentation and recorded the initial direction.
- **June 9–28, 2025:** Added Docker and Docker Compose deployment, API environment configuration, error handling, and the first roadmap.
- **September 7–13, 2025:** Improved deployment documentation and built the first working sleep-stage graph.
- **September 14, 2025–August 21, 2026:** The project was dormant.
- **August 22, 2026:** Returned to active development and completed a large Codex-assisted architectural refactor.
