const crypto = require("crypto");
const axios = require("axios");
const { sendMessage } = require("./slack");
const log = require("./log");

const { SNYK_WEBHOOK_SECRET, SNYK_WEBHOOK_CALLBACK_URL, SNYK_API_KEY } =
  process.env;
const SNYK_API_BASE_URL =
  process.env.SNYK_API_BASE_URL || "https://snyk.io/api/v1";

const axiosClient = axios.create({
  baseURL: SNYK_API_BASE_URL,
  timeout: 5000,
  headers: { "User-Agent": "snyk-slacker-3000" },
});

const snykGet = (url) =>
  axiosClient.get(url, {
    headers: { authorization: `token ${SNYK_API_KEY}` },
  });

const snykPost = (url, body) =>
  axiosClient.post(url, body, {
    headers: { authorization: `token ${SNYK_API_KEY}` },
  });

function makeSignature(body, secret) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body, "utf8");

  return `sha256=${hmac.digest("hex")}`;
}

function verifySignature(body, expectedSignature) {
  const actualSignature = makeSignature(body, SNYK_WEBHOOK_SECRET);
  return actualSignature === expectedSignature;
}

async function getSnykOrganizations() {
  const response = await snykGet("/user/me");
  return response.data.orgs;
}

async function getWebhooksForOrganization(orgId) {
  const response = await snykGet(`/org/${orgId}/webhooks`);
  return response.data.results;
}

async function registerOrganizationWebhook(
  { id, name },
  url,
  secret,
  channelId
) {
  const allOrgWebhooks = await getWebhooksForOrganization(id);
  const existingWebhooks = allOrgWebhooks.filter(
    (webhook) => webhook.url === url
  );
  if (existingWebhooks.length) {
    const webhookIds = existingWebhooks.map((webhook) => webhook.id);
    log.debug(
      `Existing webhooks found for org ${name} (${id}): ${webhookIds.join(
        ", "
      )}`
    );
    return;
  }

  const payload = { url, secret };
  try {
    const response = await snykPost(`/org/${id}/webhooks`, payload);
    log.success(
      `Registered webhook for org ${name} (${id}): ${response.data.id}`
    );
    if (channelId) {
      await sendMessage(channelId, {
        text: `Snyk notifications enabled for ${name}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `:snyk: Notifications for \`${name}\` are now enabled! :partying_face:`,
            },
          },
        ],
      });
    }
  } catch (e) {
    log.error(`Error registrering webhook for org ${name} (${id}): ${e}`);
  }
}

async function registerAllOrganizationWebhooks(configMap) {
  if (!SNYK_WEBHOOK_CALLBACK_URL || !SNYK_WEBHOOK_SECRET) {
    log.debug(
      `Callback URL (SNYK_WEBHOOK_CALLBACK_URL) and/or secret (SNYK_WEBHOOK_SECRET) not specified. Skipping webhook registration`
    );
    return;
  }

  const organizationNames = Object.keys(configMap);

  const allOrganizations = await getSnykOrganizations();
  allOrganizations
    .filter((org) => organizationNames.includes(org.name))
    .forEach((org) => {
      registerOrganizationWebhook(
        org,
        SNYK_WEBHOOK_CALLBACK_URL,
        SNYK_WEBHOOK_SECRET,
        configMap[org.name]?.slackChannelId
      );
    });

  const nonExistingOrgs = organizationNames.filter(
    (orgName) => !allOrganizations.find((snykOrg) => snykOrg.name === orgName)
  );
  if (nonExistingOrgs.length) {
    log.warn(`Organizations not found in Snyk: ${nonExistingOrgs.join(", ")}`);

    nonExistingOrgs.forEach((orgName) => {
      const config = configMap[orgName];
      if (config && config.slackChannelId) {
        sendMessage(config.slackChannelId, {
          text: `Organization not found: ${name}`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `Oh no! I can't find \`${name}\` in Snyk :grimacing: `,
              },
            },
          ],
        });
      }
    });
  }
}

module.exports = {
  verifySignature,
  registerAllOrganizationWebhooks,
};
