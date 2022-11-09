const { getConfigForOrg } = require("./config");
const slack = require("./slack");
const log = require("./log");

const severityEmojis = {
  low: ":severity-low:",
  medium: ":severity-medium:",
  high: ":severity-high:",
  critical: ":severity-critical:",
};

function createSlackMessage(org, project, newIssues) {
  const text = `Snyk alert: ${org.name}/${project.name}`;

  const issueBlocks = newIssues.map((issue) => ({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `${severityEmojis[issue.issueData.severity]} *<${
          issue.issueData.url
        }|${issue.issueData.title}>* in \`${
          issue.pkgName
        } ${issue.pkgVersions.join(", ")}\``,
      },
    ],
  }));

  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*<${org.url}|:snyk:[${org.name}]>* Alerts in <${project.browseUrl}|${project.name}>:`,
      },
    },
    ...issueBlocks,
  ];

  return { text, blocks };
}

function applyIssueFilter(issues, config) {
  return issues.filter(
    (issue) =>
      config.severity.includes(issue.issueData.severity) &&
      config.issueType.includes(issue.issueType)
  );
}

async function handleSnykWebhook({
  eventType,
  project,
  org,
  group,
  newIssues,
}) {
  log.debug(
    `Received webhook: ${JSON.stringify({
      eventType,
      project,
      org,
      group,
      newIssues,
    })}`
  );

  const config = getConfigForOrg(org.name);
  if (!config) {
    log.debug(`No config found for ${org.name}`);
    return;
  }
  const filteredIssues = applyIssueFilter(newIssues, config);
  if (!filteredIssues.length) {
    log.debug(`No new issues found for ${org.name}/${project.name}`);
    return;
  }

  const slackMessage = createSlackMessage(org, project, filteredIssues);

  await slack.sendMessage(config.slackChannelId, slackMessage);
}

module.exports = {
  handleSnykWebhook,
  createSlackMessage,
};
