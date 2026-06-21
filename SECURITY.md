# Security Policy

## Reporting a Vulnerability

GitBuddy Bot takes security seriously. If you discover a security vulnerability, please report it responsibly.

**Do NOT open a public issue.** Instead, report vulnerabilities privately:

1. **GitHub Security Advisories:** Use the [Report a Vulnerability](https://github.com/shiv-source/gitbuddy-bot/security/advisories/new) page
2. **Email (if applicable):** Contact the maintainers directly

We will acknowledge receipt within 48 hours and aim to publish a fix within 90 days, depending on severity.

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest `main` branch | ✅ |
| Latest tagged release | ✅ |
| Older releases | ❌ |

## Scope

The following are in scope for security reports:

- **Authentication / authorization bypass** — unauthorized access to org repos or admin functions
- **Credential exposure** — leaked tokens, PATs, or webhook secrets
- **Injection vulnerabilities** — command injection via slash commands, YAML config parsing attacks
- **Dependency vulnerabilities** — critical/high CVEs in runtime dependencies
- **Webhook signature verification** — bypass of Probot's webhook verification
- **Rate limiting bypass** — circumventing the middleware rate limiter

## Out of Scope

- Missing security headers on the health endpoint (the bot is not a web application)
- Theoretical vulnerabilities without a working proof of concept
- Social engineering attacks
- Physical security

## Security Features

GitBuddy Bot includes built-in security scanning:

- **Secret scanning** — detects leaked credentials in commits and issues
- **PAT age reminders** — alerts when personal access tokens exceed configured age
- **Branch protection enforcement** — verifies required status checks and review counts
- **Rate limiting** — per-event-type concurrency caps to prevent abuse

Configuration for these features is documented in the [security configuration docs](docs/configuration/security.md).

## Dependency Management

Dependencies are managed via pnpm. We use Renovate/Dependabot (where configured) for automated updates. Run `pnpm audit` to check for known vulnerabilities in dependencies.

## Responsible Disclosure Timeline

- **Day 0:** Vulnerability reported
- **Day 2:** Acknowledgment of receipt
- **Day 7:** Initial assessment and severity classification
- **Day 30:** Patch developed and reviewed
- **Day 45:** Coordinated disclosure (sooner for critical issues)
