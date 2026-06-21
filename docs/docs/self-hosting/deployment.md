# Deployment

Deploy GitBuddy Bot to your preferred hosting platform.

## Railway

[Railway](https://railway.app/) is the simplest option for Node.js apps.

1. Connect your GitHub repo to Railway
2. Set the build command: `pnpm install && pnpm run build`
3. Set the start command: `pnpm start`
4. Add environment variables from [GitHub App Setup](github-app-setup.md#6-configure-environment-variables)
5. Set the webhook URL in your GitHub App to `https://<railway-url>/webhook`

Railway auto-provisions a public URL and SSL certificate.

## Fly.io

1. Install the [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/)
2. Create a `fly.toml`:

```toml
app = "gitbuddy-bot"
primary_region = "iad"

[build]
  builder = "heroku/buildpacks:20"

[env]
  PORT = "3000"

[[services]]
  internal_port = 3000
```

3. Set secrets:

```bash
fly secrets set APP_ID=12345
fly secrets set PRIVATE_KEY="$(cat private-key.pem)"
fly secrets set WEBHOOK_SECRET="your-secret"
```

4. Deploy: `fly deploy`

## Render

1. Create a new **Web Service** on [Render](https://render.com/)
2. Connect your GitHub repo
3. Configure:
   - **Build Command:** `pnpm install && pnpm run build`
   - **Start Command:** `pnpm start`
   - **Environment Variables:** See [environment variables](environment-variables.md)
4. Choose the **Free** or **Starter** plan

## VPS (Any Linux Server)

```bash
# Install Node.js ≥24 and pnpm
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm

# Clone and set up
git clone https://github.com/shiv-source/gitbuddy-bot.git
cd gitbuddy-bot
pnpm install
pnpm run build

# Set environment variables
export APP_ID=12345
export PRIVATE_KEY="$(cat /path/to/private-key.pem)"
export WEBHOOK_SECRET="your-secret"

# Run with a process manager
pnpm add -g pm2
pm2 start dist/index.js --name gitbuddy-bot
pm2 save
pm2 startup
```

## Post-Deployment Checklist

- [ ] Health endpoint returns 200: `GET /health`
- [ ] Webhook URL is accessible from the internet
- [ ] GitHub App webhook deliveries show successful (no 4xx/5xx)
- [ ] Test issue gets the `triage` label
- [ ] Logs show events being processed
