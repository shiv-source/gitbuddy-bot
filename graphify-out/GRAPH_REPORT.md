# Graph Report - gitbuddy-bot  (2026-06-22)

## Corpus Check
- 115 files · ~265,164 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 953 nodes · 1288 edges · 79 communities (67 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `083874cd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Command System|Command System]]
- [[_COMMUNITY_Event Handlers|Event Handlers]]
- [[_COMMUNITY_Core Interfaces|Core Interfaces]]
- [[_COMMUNITY_Configuration & Errors|Configuration & Errors]]
- [[_COMMUNITY_Docs Site Dependencies|Docs Site Dependencies]]
- [[_COMMUNITY_App Dependencies|App Dependencies]]
- [[_COMMUNITY_TypeScript Compiler Options|TypeScript Compiler Options]]
- [[_COMMUNITY_Root Package Configuration|Root Package Configuration]]
- [[_COMMUNITY_Architecture Documentation|Architecture Documentation]]
- [[_COMMUNITY_Feature Configuration|Feature Configuration]]
- [[_COMMUNITY_API Documentation Generation|API Documentation Generation]]
- [[_COMMUNITY_Architecture Concepts|Architecture Concepts]]
- [[_COMMUNITY_Integrations & Deployment|Integrations & Deployment]]
- [[_COMMUNITY_Docs Branding|Docs Branding]]
- [[_COMMUNITY_In-Memory Cache|In-Memory Cache]]
- [[_COMMUNITY_YAML Config Provider|YAML Config Provider]]
- [[_COMMUNITY_Context Enrichment|Context Enrichment]]
- [[_COMMUNITY_Middleware Pipeline|Middleware Pipeline]]
- [[_COMMUNITY_Test Configuration|Test Configuration]]
- [[_COMMUNITY_Homepage UI Component|Homepage UI Component]]
- [[_COMMUNITY_GitBuddy Brand|GitBuddy Brand]]
- [[_COMMUNITY_Docusaurus Config|Docusaurus Config]]
- [[_COMMUNITY_Sidebar Configuration|Sidebar Configuration]]
- [[_COMMUNITY_Event Processing|Event Processing]]
- [[_COMMUNITY_GitHub Client Interface|GitHub Client Interface]]
- [[_COMMUNITY_Health Check API|Health Check API]]
- [[_COMMUNITY_Webhook API|Webhook API]]
- [[_COMMUNITY_Adapter Pattern|Adapter Pattern]]
- [[_COMMUNITY_Auto Bootstrap|Auto Bootstrap]]
- [[_COMMUNITY_Weekly Digest|Weekly Digest]]
- [[_COMMUNITY_PAT Rotation|PAT Rotation]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]

## God Nodes (most connected - your core abstractions)
1. `EventContext` - 45 edges
2. `HandlerResult` - 33 edges
3. `OctokitClient` - 23 edges
4. `compilerOptions` - 22 edges
5. `ILogger` - 21 edges
6. `BaseHandler` - 21 edges
7. `scripts` - 17 edges
8. `GitBuddy Bot 🤖` - 17 edges
9. `IGitHubClient` - 14 edges
10. `IConfigProvider` - 14 edges

## Surprising Connections (you probably didn't know these)
- `GitHub App Manifest` --references--> `GitBuddy Bot 🤖`  [EXTRACTED]
  app/app.yml → README.md
- `Contributor Covenant` --references--> `GitBuddy Bot 🤖`  [EXTRACTED]
  CODE_OF_CONDUCT.md → README.md
- `Conventional Commits` --references--> `GitBuddy Bot 🤖`  [EXTRACTED]
  CONTRIBUTING.md → README.md
- `Vulnerability Reporting` --references--> `GitBuddy Bot 🤖`  [EXTRACTED]
  SECURITY.md → README.md
- `StaleService` --conceptually_related_to--> `StaleHandler`  [INFERRED]
  docs/docs/architecture/services.md → docs/docs/architecture/handlers.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Request Processing Pipeline** — claudemd_request_lifecycle, claudemd_middleware_chain, claudemd_base_handler, claudemd_error_hierarchy, claudemd_services_layer, claudemd_infrastructure_adapters [EXTRACTED 1.00]
- **Architecture Design Patterns** — claudemd_composition_root, claudemd_dependency_inversion, claudemd_command_pattern, claudemd_base_handler, claudemd_infrastructure_adapters [EXTRACTED 1.00]
- **Middleware Pipeline** — architecture_middleware_contextenricher, architecture_middleware_ratelimiter, architecture_middleware_errorhandler, architecture_overview_chain_of_responsibility [EXTRACTED 1.00]
- **Handler Template Method Hierarchy** — architecture_handlers_basehandler, architecture_handlers_governancehandler, architecture_handlers_automationhandler, architecture_handlers_securityhandler, architecture_handlers_stalehandler, architecture_handlers_insightshandler, architecture_handlers_synchandler, architecture_handlers_copilothandler, architecture_overview_template_method [EXTRACTED 1.00]
- **GitBuddy Configuration System** — configuration_overview_gitbuddy_config, configuration_overview_fallback_chain, configuration_overview_iconfig_provider, configuration_reference_schema [EXTRACTED 1.00]
- **Stale Management Lifecycle** — configuration_stale_management_two_phase, configuration_stale_management_mark_phase, configuration_stale_management_close_phase, configuration_automation_stale_sweep [EXTRACTED 1.00]
- **Self-Hosting Deployment Pipeline** — self_hosting_prerequisites_setup, self_hosting_github_app_setup_registration, self_hosting_github_app_setup_permissions, self_hosting_environment_variables_list, self_hosting_deployment_railway, self_hosting_monitoring_health [INFERRED 0.85]

## Communities (79 total, 12 thin omitted)

### Community 0 - "Command System"
Cohesion: 0.52
Nodes (6): check(), err(), header(), info(), warn(), setup.sh script

### Community 1 - "Event Handlers"
Cohesion: 0.07
Nodes (34): AutomationConfig, CopilotConfig, EventContext, GovernanceConfig, HandlerResult, InsightsConfig, IntegrationConfig, LabelRule (+26 more)

### Community 2 - "Core Interfaces"
Cohesion: 0.15
Nodes (3): RepoInfo, BranchProtection, OctokitClient

### Community 3 - "Configuration & Errors"
Cohesion: 0.14
Nodes (10): FALLBACK_PATHS, AppError, ConfigError, ConfigNotFoundError, GitHubApiError, HandlerError, NotFoundError, RateLimitError (+2 more)

### Community 4 - "Docs Site Dependencies"
Cohesion: 0.06
Nodes (35): browserslist, development, production, dependencies, clsx, @docusaurus/core, @docusaurus/faster, @docusaurus/preset-classic (+27 more)

### Community 5 - "App Dependencies"
Cohesion: 0.06
Nodes (34): author, dependencies, octokit, probot, yaml, description, devDependencies, jest (+26 more)

### Community 6 - "TypeScript Compiler Options"
Cohesion: 0.08
Nodes (24): compilerOptions, allowSyntheticDefaultImports, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib (+16 more)

### Community 7 - "Root Package Configuration"
Cohesion: 0.07
Nodes (26): description, devDependencies, husky, engines, node, pnpm, name, private (+18 more)

### Community 8 - "Architecture Documentation"
Cohesion: 0.09
Nodes (23): GitHub App Manifest, Contributor Covenant, Conventional Commits, Architecture, Configuration, Contributing, Development, Docs Site (+15 more)

### Community 9 - "Feature Configuration"
Cohesion: 0.14
Nodes (17): Merge Queue Feature, Stale Sweep Feature, AI PR Description Generation, AI PR Review, Anthropic API Integration, AI Label Suggestion, Branch Protection Enforcement, MFA Enforcement (+9 more)

### Community 10 - "API Documentation Generation"
Cohesion: 0.12
Nodes (16): cleanOutputDir, entryPoints, entryPointStrategy, excludeInternal, excludePrivate, excludeProtected, githubPages, hideGenerator (+8 more)

### Community 11 - "Architecture Concepts"
Cohesion: 0.05
Nodes (42): AppError Hierarchy, Core Interfaces, EventContext, GitBuddyConfig, HandlerResult, ICache, ICommand, IConfigProvider (+34 more)

### Community 12 - "Integrations & Deployment"
Cohesion: 0.08
Nodes (30): Environment Variable References, Full Example, Integrations, `jira`, `linear`, Options, `slack`, Deployment (+22 more)

### Community 13 - "Docs Branding"
Cohesion: 0.22
Nodes (10): Docusaurus Documentation Brand, Docusaurus Ease of Use Value Proposition, Docusaurus Focus on Content Value Proposition, Docusaurus Powered by React, Docusaurus Logo (PNG), Docusaurus Social Card, Docusaurus Logo (SVG), Easy to Use Illustration (+2 more)

### Community 14 - "In-Memory Cache"
Cohesion: 0.33
Nodes (3): CacheEntry, MemoryCache, ICache

### Community 15 - "YAML Config Provider"
Cohesion: 0.18
Nodes (11): Adding a New Handler, Adding a New Slash Command, Architecture, Code of Conduct, Contributing to GitBuddy Bot, Dev Environment, Getting Started, Testing (+3 more)

### Community 16 - "Context Enrichment"
Cohesion: 0.13
Nodes (9): IEventHandler, ILogger, RepoRef, ContextEnricher, ProbotContext, ErrorHandler, RateLimitBucket, RateLimiter (+1 more)

### Community 17 - "Middleware Pipeline"
Cohesion: 0.22
Nodes (8): Adding a Domain Handler, Checklist, Overview, Step 1: Create the Handler File, Step 2: Register in the Composition Root, Step 3: Add Config Type (if needed), Step 4: Add Tests, Step 5: Add Config to Documentation

### Community 18 - "Test Configuration"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 20 - "GitBuddy Brand"
Cohesion: 1.00
Nodes (3): GitBuddy Bot Brand Identity, GitBuddy Bot Logo (Full), GitBuddy Bot Logo (Small)

### Community 24 - "Event Processing"
Cohesion: 0.06
Nodes (32): Build and Run, Clone and Install, Installation, Manual Setup, Next Steps, One-Command Setup (Recommended), Prerequisites, Verify Setup (+24 more)

### Community 25 - "GitHub Client Interface"
Cohesion: 0.06
Nodes (28): Aliases, Examples, `/label`, Requirements, Usage, What It Does, Configuration, Example (+20 more)

### Community 32 - "Community 32"
Cohesion: 0.12
Nodes (10): CommandRouter, LabelCommand, ShipitCommand, TriageCommand, CommandContext, CommandResult, ICommand, ProbotLog (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.50
Nodes (3): GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED, graphify-post-checkout.sh script

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (9): Architecture, Dependency Inversion (the backbone), Error hierarchy, Handlers (Template Method pattern), Infrastructure adapters, Project tree, Request lifecycle (middleware chain), Services (pure business logic) (+1 more)

### Community 35 - "Community 35"
Cohesion: 0.09
Nodes (22): Build Initial Graphs, Code-review-graph Analysis, File Reference, "graphify not found", Graphify Queries, Graphify rebuild fails, Hook slows down commits, How Graphs Are Kept Current (+14 more)

### Community 36 - "Community 36"
Cohesion: 0.15
Nodes (12): Adding a New Handler, Automation Handler, BaseHandler — Template Method, Copilot Handler, Governance Handler, Handler Contract, Handlers, Insights Handler (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (11): Architecture Overview, Commands (`src/commands/`), Core (`src/core/`), Dependency Flow, Handlers (`src/handlers/`), High-Level Architecture, Infrastructure (`src/infrastructure/`), Key Design Patterns (+3 more)

### Community 38 - "Community 38"
Cohesion: 0.17
Nodes (11): `autoAssignOnCreate`, Automation, `closeAfterDays`, `defaultIssueLabels`, `exemptLabels`, Full Example, `mergeQueueEnabled`, Options (+3 more)

### Community 39 - "Community 39"
Cohesion: 0.17
Nodes (11): `closeAfterDays`, `closeMessage`, `exemptLabels`, Full Example, How It Works, Options, Stale Management, `staleAfterDays` (+3 more)

### Community 40 - "Community 40"
Cohesion: 0.20
Nodes (9): AI Copilot, Full Example, `labelSuggestionEnabled`, `maxTokens`, `model`, Options, `prDescriptionEnabled`, `prReviewEnabled` (+1 more)

### Community 41 - "Community 41"
Cohesion: 0.20
Nodes (9): `ciHealthThreshold`, `collectDoraMetrics`, `digestSchedule`, DORA Metrics Collected, Full Example, Insights, `metricsRetentionDays`, Options (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.20
Nodes (9): `alertChannel`, `alertOnNewCollaborator`, `blockSecretsOnPush`, Full Example, `maxPatAgeDays`, Options, `scanForSecrets`, `secretPatterns` (+1 more)

### Community 43 - "Community 43"
Cohesion: 0.22
Nodes (8): `autoBootstrapPatterns`, `enforceMfa`, Full Example, Governance, Options, `requiredFiles`, `requiredReviewCount`, `requiredStatusChecks`

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (8): Integration Tests, Running Tests, Test Coverage, Test Framework, Test Organization, Testing, Testing Services, Unit Tests

### Community 45 - "Community 45"
Cohesion: 0.22
Nodes (3): IConfigProvider, IGitHubClient, StaleService

### Community 46 - "Community 46"
Cohesion: 0.14
Nodes (14): Active Hooks, Adding a New Hook, Git Hooks, Hook Architecture, Hook Timeouts, How Husky Gets Installed, How It Works on a Fresh Clone, Installation Details (+6 more)

### Community 47 - "Community 47"
Cohesion: 0.22
Nodes (8): Dependency Management, Out of Scope, Reporting a Vulnerability, Responsible Disclosure Timeline, Scope, Security Features, Security Policy, Supported Versions

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (8): `automation`, Configuration Reference, `copilot`, `governance`, `insights`, `integrations`, `security`, `sync`

### Community 49 - "Community 49"
Cohesion: 0.25
Nodes (7): Actual Behavior, Additional Context, Configuration, Description, Environment, Expected Behavior, Steps to Reproduce

### Community 50 - "Community 50"
Cohesion: 0.29
Nodes (6): Context Enricher, Error Handler, Middleware, Middleware Registration, Pipeline, Rate Limiter

### Community 51 - "Community 51"
Cohesion: 0.29
Nodes (6): Configuration, Example, `@gitbuddy summarize`, Requirements, Usage, What It Does

### Community 52 - "Community 52"
Cohesion: 0.29
Nodes (7): Config File Format, Configuration Overview, Full Reference, Minimal Config, Programmatic Access, Sections, Where to Place Config

### Community 53 - "Community 53"
Cohesion: 0.33
Nodes (5): Adding a New Event Subscription, Event → Handler Mapping, Event Payload Shape, Event Processing Flow, GitHub Events

### Community 54 - "Community 54"
Cohesion: 0.33
Nodes (5): Error Responses, Health Check, Rate Limiting, REST API, Webhook

### Community 55 - "Community 55"
Cohesion: 0.33
Nodes (6): Architecture at a Glance, Getting Help, How It Works, Introduction, License, What GitBuddy Bot Does

### Community 56 - "Community 56"
Cohesion: 0.29
Nodes (7): 1. Install the GitHub App, 2. Create the Config File, 3. Verify It's Working, 4. Set Up Stale Sweeps (Optional), 5. Development Setup (Contributors), Next Steps, Quick Start

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (5): Build, Deployment, Installation, Local Development, Website

### Community 58 - "Community 58"
Cohesion: 0.14
Nodes (14): 1. Install pnpm, 2. Clone and Install Dependencies, 3. Install Knowledge Graph Tools (Optional), 4. Register MCP Servers (Optional — Claude Code only), Development Setup, Development Workflow, Make Targets Quick Reference, Manual Setup (Step by Step) (+6 more)

### Community 59 - "Community 59"
Cohesion: 0.33
Nodes (5): Additional Context, Affected Domain(s), Alternatives Considered, Problem Statement, Proposed Solution

### Community 60 - "Community 60"
Cohesion: 0.40
Nodes (4): Debug Issue, Steps, Tips, Token Efficiency Rules

### Community 61 - "Community 61"
Cohesion: 0.40
Nodes (4): Explore Codebase, Steps, Tips, Token Efficiency Rules

### Community 62 - "Community 62"
Cohesion: 0.33
Nodes (7): CheckConclusion, CheckDetails, IssueSearchResult, IssueUpdate, PullRequestInfo, TeamMember, ProbotOctokit

### Community 63 - "Community 63"
Cohesion: 0.40
Nodes (4): graphify-mcp, uvx, code-review-graph, graphify

### Community 64 - "Community 64"
Cohesion: 0.40
Nodes (4): Refactor Safely, Safety Checks, Steps, Token Efficiency Rules

### Community 65 - "Community 65"
Cohesion: 0.40
Nodes (4): Output Format, Review Changes, Steps, Token Efficiency Rules

### Community 68 - "Community 68"
Cohesion: 0.50
Nodes (3): GRAPHIFY_CHANGED, PYTHONHASHSEED, graphify-pre-commit.sh script

### Community 69 - "Community 69"
Cohesion: 0.22
Nodes (9): Code Style, Dependency Injection, Error Handling, Formatting, GitBuddy-Specific Rules, Handler Pattern, Imports, Naming (+1 more)

### Community 70 - "Community 70"
Cohesion: 0.25
Nodes (7): Commands, Conventions, graphify, Key Tools, MCP Tools: code-review-graph, When to use graph tools FIRST, Workflow

### Community 71 - "Community 71"
Cohesion: 0.25
Nodes (8): After Merge, Before Committing, Branching, Code Review, Commit Messages, Development Workflow, Knowledge Graph Auto-Rebuild, Pull Requests

### Community 72 - "Community 72"
Cohesion: 0.29
Nodes (7): Attribution, Contributor Covenant Code of Conduct, Enforcement, Enforcement Responsibilities, Our Pledge, Our Standards, Scope

### Community 73 - "Community 73"
Cohesion: 0.29
Nodes (6): Affected Domains, Checklist, Description, Screenshots / Logs (if applicable), Testing, Type of Change

### Community 74 - "Community 74"
Cohesion: 0.33
Nodes (4): BranchProtectionPayload, RepositoryCreatedPayload, createContext(), createMockOctokit()

### Community 75 - "Community 75"
Cohesion: 0.40
Nodes (5): 1. Correction, 2. Warning, 3. Temporary Ban, 4. Permanent Ban, Enforcement Guidelines

### Community 76 - "Community 76"
Cohesion: 0.40
Nodes (5): Before Submitting a PR, Branching, Commit Messages, Development Workflow, Pull Request Template

## Knowledge Gaps
- **529 isolated node(s):** `Why Husky?`, `Hook Architecture`, `Pre-commit (`scripts/graphify-pre-commit.sh`)`, `Post-checkout (`scripts/graphify-post-checkout.sh`)`, `Python Detection` (+524 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Knowledge Graphs` connect `Community 35` to `Community 66`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `Why Husky?`, `Hook Architecture`, `Pre-commit (`scripts/graphify-pre-commit.sh`)` to the rest of the system?**
  _531 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Event Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.06773211567732115 - nodes in this community are weakly interconnected._
- **Should `Core Interfaces` be split into smaller, more focused modules?**
  _Cohesion score 0.14624505928853754 - nodes in this community are weakly interconnected._
- **Should `Configuration & Errors` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `Docs Site Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `App Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._