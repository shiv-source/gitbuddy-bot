---
sidebar_position: 99
---

# Configuration Reference

Complete schema for `.github/gitbuddy.yml`. Every key, type, default, and description.

## `governance`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `governance.autoBootstrapPatterns` | `string[]` | `[]` | Regex patterns for repos to auto-bootstrap |
| `governance.requiredStatusChecks` | `string[]` | `[]` | Required CI status checks for PRs |
| `governance.requiredReviewCount` | `number` | `1` | Approving reviews required to merge |
| `governance.enforceMfa` | `boolean` | `false` | Check org members have MFA enabled |
| `governance.requiredFiles` | `string[]` | `[]` | Files that must exist in every repo |

## `automation`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `automation.defaultIssueLabels` | `string[]` | `["triage"]` | Labels auto-applied to new issues |
| `automation.staleAfterDays` | `number` | `60` | Days of inactivity before marking stale |
| `automation.closeAfterDays` | `number` | `7` | Days after stale before closing |
| `automation.staleLabel` | `string` | `"stale"` | Label applied to stale issues |
| `automation.exemptLabels` | `string[]` | `[]` | Labels that prevent stale marking |
| `automation.autoAssignOnCreate` | `boolean` | `false` | Auto-assign new issues to maintainers |
| `automation.prChecklistRequired` | `boolean` | `false` | Require PR checklist completion |
| `automation.mergeQueueEnabled` | `boolean` | `false` | Enable `/merge` queue |
| `automation.staleMessage` | `string` | auto | Custom stale issue comment |
| `automation.closeMessage` | `string` | auto | Custom close issue comment |

## `security`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `security.alertChannel` | `string` | `""` | Security alert destination |
| `security.maxPatAgeDays` | `number` | `90` | Max PAT age before rotation reminder |
| `security.scanForSecrets` | `boolean` | `true` | Scan commits/issues for secrets |
| `security.secretPatterns` | `string[]` | `[]` | Additional secret regex patterns |
| `security.blockSecretsOnPush` | `boolean` | `false` | Block pushes with detected secrets |
| `security.alertOnNewCollaborator` | `boolean` | `false` | Alert on new collaborator added |

## `sync`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `sync.downstreamRepos` | `Record<string, string[]>` | `{}` | Map source repo → downstream repos for change propagation |

## `insights`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `insights.collectDoraMetrics` | `boolean` | `false` | Collect DORA metrics |
| `insights.ciHealthThreshold` | `number` | `0.9` | CI pass rate threshold (0.0–1.0) |
| `insights.weeklyDigestEnabled` | `boolean` | `false` | Generate weekly activity digest |
| `insights.digestSchedule` | `string` | `"0 9 * * 1"` | Cron for digest generation |
| `insights.metricsRetentionDays` | `number` | `90` | DORA metrics retention period |

## `copilot`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `copilot.prReviewEnabled` | `boolean` | `false` | AI review of new PRs |
| `copilot.prDescriptionEnabled` | `boolean` | `true` | AI-generated PR descriptions |
| `copilot.labelSuggestionEnabled` | `boolean` | `false` | AI label suggestions |
| `copilot.maxTokens` | `number` | `4096` | Max tokens for AI API calls |
| `copilot.model` | `string` | `"claude-sonnet-4-6"` | AI model identifier |
| `copilot.reviewFocus` | `string[]` | `["bugs","security","style"]` | AI review focus categories |

## `integrations`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `integrations.slack.webhookUrl` | `string` | `""` | Slack incoming webhook |
| `integrations.slack.channel` | `string` | `""` | Default Slack channel |
| `integrations.slack.notifyOn` | `string[]` | `[]` | Event types to notify |
| `integrations.jira.baseUrl` | `string` | `""` | Jira instance URL |
| `integrations.jira.email` | `string` | `""` | Bot email for Jira |
| `integrations.jira.apiToken` | `string` | `""` | Jira API token |
| `integrations.jira.projectKey` | `string` | `""` | Default Jira project |
| `integrations.linear.apiKey` | `string` | `""` | Linear API key |
| `integrations.linear.teamId` | `string` | `""` | Default Linear team |
