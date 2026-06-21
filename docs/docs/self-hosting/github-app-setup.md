# GitHub App Setup

Step-by-step guide to register your GitBuddy Bot GitHub App.

## 1. Create the GitHub App

1. Go to **Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**
   - Org: `https://github.com/organizations/<your-org>/settings/apps/new`
   - Personal: `https://github.com/settings/apps/new`

2. Fill in the form:

| Field | Value |
|-------|-------|
| **GitHub App name** | `GitBuddy Bot (Staging)` or your preferred name |
| **Homepage URL** | Your bot's URL or repo |
| **Webhook URL** | `https://<your-deployment-url>/webhook` |
| **Webhook secret** | Generate a strong random string (`openssl rand -hex 32`) |

## 2. Configure Permissions

Set the following repository permissions:

| Permission | Access |
|------------|--------|
| Issues | **Read & write** |
| Pull requests | **Read & write** |
| Contents | **Read-only** |
| Metadata | **Read-only** (auto-set) |
| Checks | **Read & write** |
| Commit statuses | **Read & write** |
| Administration | **Read-only** |

Set the following organization permissions:

| Permission | Access |
|------------|--------|
| Members | **Read-only** |

## 3. Subscribe to Events

Check these event subscriptions:
- [x] Issues
- [x] Issue comment
- [x] Pull request
- [x] Push
- [x] Check run
- [x] Check suite
- [x] Workflow run
- [x] Deployment status
- [x] Repository
- [x] Branch protection rule

## 4. Generate Private Key

1. After creating the app, scroll to **Private keys**
2. Click **Generate a private key**
3. Save the `.pem` file securely — you'll need it for the bot's environment variables

## 5. Install the App

1. Go to **Install App** in the sidebar
2. Choose your organization
3. Select **All repositories** (recommended) or specific repos
4. Click **Install**

## 6. Configure Environment Variables

Set these environment variables where you deploy the bot:

```bash
# Required
APP_ID=<your-github-app-id>
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
<your-private-key-content>
-----END RSA PRIVATE KEY-----"
WEBHOOK_SECRET=<your-webhook-secret>

# Optional
PORT=3000
LOG_LEVEL=info
```

## 7. Verify Installation

1. Deploy the bot with the environment variables
2. Check the health endpoint: `GET https://<your-bot-url>/health`
3. Create a test issue in any installed repo — it should get the `triage` label

## Next Steps

- [Deployment](deployment.md) — deploy to a hosting platform
- [Environment Variables](environment-variables.md) — all available env vars
