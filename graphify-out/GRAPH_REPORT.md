# Graph Report - .  (2026-06-21)

## Corpus Check
- Corpus is ~14,652 words - fits in a single context window. You may not need a graph.

## Summary
- 315 nodes · 642 edges · 18 communities (11 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 38,843 input · 19,696 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Core Interfaces and Types|Core Interfaces and Types]]
- [[_COMMUNITY_Package Configuration|Package Configuration]]
- [[_COMMUNITY_Handler Tests and Base|Handler Tests and Base]]
- [[_COMMUNITY_GitHub Client Adapter|GitHub Client Adapter]]
- [[_COMMUNITY_Slash Commands|Slash Commands]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Middleware Pipeline|Middleware Pipeline]]
- [[_COMMUNITY_Configuration and Errors|Configuration and Errors]]
- [[_COMMUNITY_Documentation and Roadmap|Documentation and Roadmap]]
- [[_COMMUNITY_Memory Cache|Memory Cache]]
- [[_COMMUNITY_YAML Config Provider|YAML Config Provider]]
- [[_COMMUNITY_Automation Handler|Automation Handler]]
- [[_COMMUNITY_Test TypeScript Config|Test TypeScript Config]]
- [[_COMMUNITY_Documentation and Roadmap|Documentation and Roadmap]]
- [[_COMMUNITY_Documentation and Roadmap|Documentation and Roadmap]]
- [[_COMMUNITY_Documentation and Roadmap|Documentation and Roadmap]]
- [[_COMMUNITY_Documentation and Roadmap|Documentation and Roadmap]]
- [[_COMMUNITY_Documentation and Roadmap|Documentation and Roadmap]]

## God Nodes (most connected - your core abstractions)
1. `EventContext` - 45 edges
2. `HandlerResult` - 33 edges
3. `OctokitClient` - 23 edges
4. `compilerOptions` - 22 edges
5. `ILogger` - 21 edges
6. `BaseHandler` - 21 edges
7. `IGitHubClient` - 14 edges
8. `IConfigProvider` - 14 edges
9. `scripts` - 11 edges
10. `YamlConfigProvider` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Feature Roadmap` --conceptually_related_to--> `Watchdog Pro`  [EXTRACTED]
  FEATURE_ROADMAP.md → CLAUDE.md
- `Watchdog Configuration Schema` --conceptually_related_to--> `Watchdog Pro`  [EXTRACTED]
  README.md → CLAUDE.md
- `GitHub App Manifest` --conceptually_related_to--> `Governance Domain`  [EXTRACTED]
  app.yml → FEATURE_ROADMAP.md
- `GitHub App Manifest` --conceptually_related_to--> `Automation Domain`  [EXTRACTED]
  app.yml → FEATURE_ROADMAP.md
- `GitHub App Manifest` --conceptually_related_to--> `Security Domain`  [EXTRACTED]
  app.yml → FEATURE_ROADMAP.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Architecture Design Patterns** — claude_md_domain_driven_design, claude_md_composition_root, claude_md_template_method, claude_md_middleware_chain [EXTRACTED 1.00]
- **Watchdog Pro Domain Modules** — feature_roadmap_governance, feature_roadmap_automation, feature_roadmap_security, feature_roadmap_stale_management, feature_roadmap_sync_orchestration, feature_roadmap_insights_dora, feature_roadmap_copilot_ai, feature_roadmap_commands, feature_roadmap_external_integrations, feature_roadmap_release_management, feature_roadmap_infrastructure_platform [EXTRACTED 1.00]

## Communities (18 total, 7 thin omitted)

### Community 0 - "Core Interfaces and Types"
Cohesion: 0.09
Nodes (31): IEventHandler, AutomationConfig, CopilotConfig, EventContext, GovernanceConfig, HandlerResult, InsightsConfig, IntegrationConfig (+23 more)

### Community 1 - "Package Configuration"
Cohesion: 0.06
Nodes (35): author, dependencies, octokit, probot, yaml, description, devDependencies, jest (+27 more)

### Community 2 - "Handler Tests and Base"
Cohesion: 0.10
Nodes (12): IConfigProvider, IGitHubClient, ILogger, createIssueContext(), createMockOctokit(), createPRContext(), createContext(), createMockOctokit() (+4 more)

### Community 3 - "GitHub Client Adapter"
Cohesion: 0.11
Nodes (10): CheckConclusion, CheckDetails, IssueSearchResult, IssueUpdate, PullRequestInfo, RepoInfo, BranchProtection, TeamMember (+2 more)

### Community 4 - "Slash Commands"
Cohesion: 0.14
Nodes (10): CommandRouter, LabelCommand, ShipitCommand, TriageCommand, CommandContext, CommandResult, ICommand, ProbotLog (+2 more)

### Community 5 - "TypeScript Configuration"
Cohesion: 0.08
Nodes (24): compilerOptions, allowSyntheticDefaultImports, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib (+16 more)

### Community 6 - "Middleware Pipeline"
Cohesion: 0.13
Nodes (7): RepoRef, ContextEnricher, ProbotContext, ErrorHandler, RateLimitBucket, RateLimiter, WatchdogProApp

### Community 7 - "Configuration and Errors"
Cohesion: 0.14
Nodes (10): FALLBACK_PATHS, AppError, ConfigError, ConfigNotFoundError, GitHubApiError, HandlerError, NotFoundError, RateLimitError (+2 more)

### Community 8 - "Documentation and Roadmap"
Cohesion: 0.12
Nodes (16): GitHub App Manifest, Composition Root Pattern, Domain-Driven Design with SOLID Layers, Graphify Knowledge Graph, Middleware Chain of Responsibility, Template Method Pipeline, Watchdog Pro, Automation Domain (+8 more)

### Community 9 - "Memory Cache"
Cohesion: 0.33
Nodes (3): CacheEntry, MemoryCache, ICache

### Community 12 - "Test TypeScript Config"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

## Knowledge Gaps
- **96 isolated node(s):** `name`, `private`, `version`, `description`, `type` (+91 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `EventContext` connect `Core Interfaces and Types` to `Handler Tests and Base`, `Slash Commands`, `Middleware Pipeline`, `Configuration and Errors`, `Automation Handler`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `OctokitClient` connect `GitHub Client Adapter` to `Handler Tests and Base`, `Middleware Pipeline`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `IGitHubClient` connect `Handler Tests and Base` to `Core Interfaces and Types`, `GitHub Client Adapter`, `Slash Commands`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _101 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Interfaces and Types` be split into smaller, more focused modules?**
  _Cohesion score 0.08514013749338974 - nodes in this community are weakly interconnected._
- **Should `Package Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Handler Tests and Base` be split into smaller, more focused modules?**
  _Cohesion score 0.09747899159663866 - nodes in this community are weakly interconnected._