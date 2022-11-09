const { App } = require("@slack/bolt");

const { SLACK_ALERT_CHANNEL, SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET } =
  process.env;

const app =
  SLACK_BOT_TOKEN && SLACK_SIGNING_SECRET
    ? new App({
        signingSecret: SLACK_SIGNING_SECRET,
        token: SLACK_BOT_TOKEN,
      })
    : null;

async function sendMessage(channelId, options) {
  console.log(
    new Date().toISOString(),
    "[debug] Sending slack message to " +
      channelId +
      ": " +
      JSON.stringify(options)
  );
  if (app) {
    await app.client.chat.postMessage({
      channel: channelId,
      unfurl_links: false,
      ...options,
    });
  }
}

const levelEmoji = {
  error: ":error:",
  warn: ":warning:",
  success: ":success:",
  info: ":information_source:",
};

async function sendAlert(message, level) {
  if (!SLACK_ALERT_CHANNEL) {
    return;
  }
  const emoji = levelEmoji[level] || ":information_source:";

  await sendMessage(SLACK_ALERT_CHANNEL, {
    text: message,
    blocks: [
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: emoji,
          },
          {
            type: "plain_text",
            text: message,
            emoji: false,
          },
        ],
      },
    ],
  });
}

module.exports = {
  sendMessage,
  sendAlert,
};
