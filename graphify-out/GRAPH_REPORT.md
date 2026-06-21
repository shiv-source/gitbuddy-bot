# Graph Report - gitbuddy-bot  (2026-06-21)

## Corpus Check
- 35 files · ~13,028 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 334 nodes · 659 edges · 18 communities (13 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c23ab9f9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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

## Communities (18 total, 5 thin omitted)

### Community 0 - "Core Interfaces and Types"
Cohesion: 0.08
Nodes (30): AutomationConfig, CopilotConfig, EventContext, GovernanceConfig, HandlerResult, InsightsConfig, IntegrationConfig, LabelRule (+22 more)

### Community 1 - "Package Configuration"
Cohesion: 0.06
Nodes (35): author, dependencies, octokit, probot, yaml, description, devDependencies, jest (+27 more)

### Community 2 - "Handler Tests and Base"
Cohesion: 0.09
Nodes (13): IConfigProvider, IGitHubClient, createIssueContext(), createMockOctokit(), createPRContext(), createContext(), createMockOctokit(), STALE_SWEEP_PATTERNS (+5 more)

### Community 3 - "GitHub Client Adapter"
Cohesion: 0.15
Nodes (3): RepoInfo, BranchProtection, OctokitClient

### Community 4 - "Slash Commands"
Cohesion: 0.22
Nodes (7): CommandRouter, LabelCommand, ShipitCommand, TriageCommand, CommandContext, CommandResult, ICommand

### Community 5 - "TypeScript Configuration"
Cohesion: 0.08
Nodes (24): compilerOptions, allowSyntheticDefaultImports, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib (+16 more)

### Community 6 - "Middleware Pipeline"
Cohesion: 0.08
Nodes (20): CheckConclusion, CheckDetails, IEventHandler, ILogger, IssueSearchResult, IssueUpdate, PullRequestInfo, RepoRef (+12 more)

### Community 7 - "Configuration and Errors"
Cohesion: 0.12
Nodes (11): FALLBACK_PATHS, YamlConfigProvider, AppError, ConfigError, ConfigNotFoundError, GitHubApiError, HandlerError, NotFoundError (+3 more)

### Community 8 - "Documentation and Roadmap"
Cohesion: 0.12
Nodes (16): GitHub App Manifest, Composition Root Pattern, Domain-Driven Design with SOLID Layers, Graphify Knowledge Graph, Middleware Chain of Responsibility, Template Method Pipeline, Watchdog Pro, Automation Domain (+8 more)

### Community 9 - "Memory Cache"
Cohesion: 0.33
Nodes (3): CacheEntry, MemoryCache, ICache

### Community 10 - "YAML Config Provider"
Cohesion: 0.17
Nodes (10): Adding a new domain handler, Adding a new slash command, Architecture, Commands, Configuration, graphify, Interfaces and types, Key design patterns (+2 more)

### Community 11 - "Automation Handler"
Cohesion: 0.29
Nodes (6): Architecture, Configuration, Design Patterns, Getting Started, Scheduled Sweeps, Watchdog Pro 🐶

### Community 12 - "Test TypeScript Config"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

## Knowledge Gaps
- **110 isolated node(s):** `name`, `private`, `version`, `description`, `type` (+105 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `EventContext` connect `Core Interfaces and Types` to `Handler Tests and Base`, `Middleware Pipeline`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `OctokitClient` connect `GitHub Client Adapter` to `Handler Tests and Base`, `Middleware Pipeline`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `IGitHubClient` connect `Handler Tests and Base` to `Core Interfaces and Types`, `GitHub Client Adapter`, `Slash Commands`, `Middleware Pipeline`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _115 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Interfaces and Types` be split into smaller, more focused modules?**
  _Cohesion score 0.08158508158508158 - nodes in this community are weakly interconnected._
- **Should `Package Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Handler Tests and Base` be split into smaller, more focused modules?**
  _Cohesion score 0.08558558558558559 - nodes in this community are weakly interconnected._