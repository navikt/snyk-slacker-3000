# Snyk Slacker 3000

Custom Snyk webhook integration to support filtering of alerts on severity.

## How to use for your team's Snyk organization

Follow these steps to receive Slack messages for "high" and "critical" severity Snyk vulnerabilities and license issues for your team:

1. Add the Slack App ["Snyker"](https://nav-it.slack.com/apps/A034HHD75RU-snyker) to your desired Slack channel (Member list -> Integrations -> Add apps -> Search for "Snyker")
2. Submit a pull request to this repository, updating [config.js](blob/main/config.json) with an additional entry:

```json
{
  "snykOrg": "…display name of your snyk org…",
  "slackChannelId": "…slack channel ID…",
  "severity": ["critical", "high"],
  "issueType": ["vuln", "license"]
}
```

**Note on Snyk org**: Use the display name of your org, and not the normalised version used in URLs and from the Snyk CLI. These are normally the same, but they're sometimes slightly different. E.g. team `aura` (display name) has an URL `aura-bkp`, which is also what's used from the CLI (`--org=aura-bkp`). Here, `aura` should be used for `snykOrg`.

**Note on Slack ID**: To find your Slack channel ID, right-click the channel name and select "Copy link". The last part of the copied URL will be the channel ID.

## How does it work?

The notifier bot works by registrering itself as a Snyk webhook receiver for the organizations mapped in `config.json`.
This is done on startup, by first checking the existing webhooks for each mapped organization, and then creating new ones for those without a configured webhook with the bot as a callback URL.

### On startup:

1. List all authorized Snyk organizations
2. For each organization listed in `config.json`, list all Snyk webhooks
3. If no organization webhook is found with the correct callback URL, create a new one

### On webhook callback received:

1. Verify webhook signature (HMAC). Discard if invalid
2. Lookup the organization name in `config.json`. Discard if not found
3. Filter new issues based on the found config
4. If new issues found matching the filter, notify configured Slack channel

---

## Development

Requires `node` version `>=16`

### Local development

Install and start the bot locally:

```shell
$ npm install
$ npm start
```

See the table below for required environment variables.

**Be aware**: If you specify `SNYK_WEBHOOK_CALLBACK_URL`, the bot will register that URL as a callback receiver in Snyk on startup.

### Configuration

| Environment variable        | Description                              | Required | Default                  |
| --------------------------- | ---------------------------------------- | -------- | ------------------------ |
| `APP_PORT`                  | Port of webhook receiver server          | No       | 3000                     |
| `SNYK_API_BASE_URL`         | Base URL for Snyk API                    | No       | `https://snyk.io/api/v1` |
| `SNYK_API_KEY`              | Organization API token                   | Yes      |                          |
| `SNYK_WEBHOOK_CALLBACK_URL` | URL for Snyk webhooks                    | No       |                          |
| `SNYK_WEBHOOK_SECRET`       | Secret used to verify webhook callbacks  | Yes      |                          |
| `SLACK_BOT_TOKEN`           | Slackbot API token                       | Yes      |                          |
| `SLACK_SIGNING_SECRET`      | Slackbot signing secret                  | Yes      |                          |
| `SLACK_ALERT_CHANNEL`       | Slack channel for important log messages | No       |                          |
