const express = require("express");
const { verifySignature, registerAllOrganizationWebhooks } = require("./snyk");
const { handleSnykWebhook } = require("./slackbot");
const { getAllConfigsByOrg } = require("./config");
const log = require("./log");

const APP_PORT = process.env.APP_PORT | 3000;

const app = express();
app.disable("x-powered-by");
app.use(
  express.raw({
    type: "*/*",
    limit: "5mb",
  })
);

app.get("/internal/healthy", (req, res) => {
  res.status(200).end("OK");
});

app.post("/snyk-callback", async (req, res) => {
  const signature = req.headers["x-hub-signature"];
  const eventType = req.headers["x-snyk-event"];
  const bufferBody = req.body;
  if (!Buffer.isBuffer(bufferBody)) {
    log.debug("Received bad payload type (expected buffer)");
    return res.status(400).end("Bad request");
  }

  const body = bufferBody.toString();

  if (!verifySignature(body, signature)) {
    log.debug(`Received bad signature for event type ${eventType}`);
    return res.status(400).end("Bad request");
  }

  if (/^ping\//.test(eventType)) {
    log.debug("Received ping event");
  } else {
    try {
      const snykData = JSON.parse(body);
      await handleSnykWebhook({ eventType, ...snykData });
    } catch (e) {
      log.debug(`Error parsing webhook data: ${e}`);
    }
  }

  res.status(200).end("OK");
});

log.debug(`Mapped snyk orgs: ${Object.keys(getAllConfigsByOrg()).join(", ")}`);

app.listen(APP_PORT, async () => {
  log.debug(`Webhook server started up on port ${APP_PORT}`);

  try {
    await registerAllOrganizationWebhooks(getAllConfigsByOrg());
  } catch (e) {
    log.error(`Error registrering snyk webhooks: ${e}`);
  }
});
