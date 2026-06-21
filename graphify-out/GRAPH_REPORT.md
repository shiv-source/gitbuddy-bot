# Graph Report - .  (2026-06-22)

## Corpus Check
- 97 files · ~258,306 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 474 nodes · 797 edges · 32 communities (20 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `EventContext` - 45 edges
2. `HandlerResult` - 33 edges
3. `OctokitClient` - 23 edges
4. `compilerOptions` - 22 edges
5. `ILogger` - 21 edges
6. `BaseHandler` - 21 edges
7. `scripts` - 16 edges
8. `IGitHubClient` - 14 edges
9. `IConfigProvider` - 14 edges
10. `GitBuddy Bot` - 12 edges

## Surprising Connections (you probably didn't know these)
- `GitHub App Manifest` --references--> `GitBuddy Bot`  [EXTRACTED]
  app/app.yml → README.md
- `Composition Root` --rationale_for--> `GitBuddy Bot`  [EXTRACTED]
  CLAUDE.md → README.md
- `Contributor Covenant` --references--> `GitBuddy Bot`  [EXTRACTED]
  CODE_OF_CONDUCT.md → README.md
- `Conventional Commits` --references--> `GitBuddy Bot`  [EXTRACTED]
  CONTRIBUTING.md → README.md
- `Quick Start Guide` --references--> `GitBuddy Bot`  [EXTRACTED]
  docs/docs/quick-start.md → README.md

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

## Communities (32 total, 12 thin omitted)

### Community 0 - "Command System"
Cohesion: 0.06
Nodes (22): CommandRouter, LabelCommand, ShipitCommand, TriageCommand, CommandContext, CommandResult, ICommand, IConfigProvider (+14 more)

### Community 1 - "Event Handlers"
Cohesion: 0.09
Nodes (22): EventContext, HandlerResult, IntegrationConfig, LabelRule, NO_ACTION, AutomationHandler, IssuePayload, BaseHandler (+14 more)

### Community 2 - "Core Interfaces"
Cohesion: 0.08
Nodes (15): CheckConclusion, CheckDetails, IEventHandler, IssueSearchResult, IssueUpdate, PullRequestInfo, RepoInfo, BranchProtection (+7 more)

### Community 3 - "Configuration & Errors"
Cohesion: 0.08
Nodes (20): FALLBACK_PATHS, AppError, ConfigError, ConfigNotFoundError, GitHubApiError, HandlerError, NotFoundError, RateLimitError (+12 more)

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
Cohesion: 0.09
Nodes (22): description, engines, node, pnpm, name, private, scripts, build (+14 more)

### Community 8 - "Architecture Documentation"
Cohesion: 0.11
Nodes (21): GitHub App Manifest, BaseHandler (Template Method), Command Pattern, Composition Root, Dependency Inversion, AppError Hierarchy, Infrastructure Adapters, Middleware Chain (+13 more)

### Community 9 - "Feature Configuration"
Cohesion: 0.14
Nodes (17): Merge Queue Feature, Stale Sweep Feature, AI PR Description Generation, AI PR Review, Anthropic API Integration, AI Label Suggestion, Branch Protection Enforcement, MFA Enforcement (+9 more)

### Community 10 - "API Documentation Generation"
Cohesion: 0.12
Nodes (16): cleanOutputDir, entryPoints, entryPointStrategy, excludeInternal, excludePrivate, excludeProtected, githubPages, hideGenerator (+8 more)

### Community 11 - "Architecture Concepts"
Cohesion: 0.13
Nodes (15): IConfigProvider, IEventHandler, ILogger, Composition Root, AutomationHandler, BaseHandler, CopilotHandler, GovernanceHandler (+7 more)

### Community 12 - "Integrations & Deployment"
Cohesion: 0.15
Nodes (15): Jira Integration, Linear Integration, Slack Integration, Fly.io Deployment, Railway Deployment, Render Deployment, VPS Deployment, Environment Variables Reference (+7 more)

### Community 13 - "Docs Branding"
Cohesion: 0.22
Nodes (10): Docusaurus Documentation Brand, Docusaurus Ease of Use Value Proposition, Docusaurus Focus on Content Value Proposition, Docusaurus Powered by React, Docusaurus Logo (PNG), Docusaurus Social Card, Docusaurus Logo (SVG), Easy to Use Illustration (+2 more)

### Community 14 - "In-Memory Cache"
Cohesion: 0.33
Nodes (3): CacheEntry, MemoryCache, ICache

### Community 16 - "Context Enrichment"
Cohesion: 0.36
Nodes (3): RepoRef, ContextEnricher, ProbotContext

### Community 17 - "Middleware Pipeline"
Cohesion: 0.60
Nodes (5): AppError Hierarchy, ContextEnricher, ErrorHandler, RateLimiter, Chain of Responsibility

### Community 18 - "Test Configuration"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 20 - "GitBuddy Brand"
Cohesion: 1.00
Nodes (3): GitBuddy Bot Brand Identity, GitBuddy Bot Logo (Full), GitBuddy Bot Logo (Small)

## Knowledge Gaps
- **196 isolated node(s):** `name`, `private`, `version`, `description`, `type` (+191 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `EventContext` connect `Event Handlers` to `Command System`, `Context Enrichment`, `Core Interfaces`, `Configuration & Errors`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `OctokitClient` connect `Core Interfaces` to `Command System`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `IGitHubClient` connect `Command System` to `Event Handlers`, `Core Interfaces`, `Configuration & Errors`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _199 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Command System` be split into smaller, more focused modules?**
  _Cohesion score 0.06041986687147977 - nodes in this community are weakly interconnected._
- **Should `Event Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.09494949494949495 - nodes in this community are weakly interconnected._
- **Should `Core Interfaces` be split into smaller, more focused modules?**
  _Cohesion score 0.07801418439716312 - nodes in this community are weakly interconnected._