const { createSlackMessage } = require("../src/slackbot");
describe("slackbot logic", () => {
  test("Message formatting", () => {
    const payload = require("./example-payload.json");

    const message = createSlackMessage(
      payload.org,
      payload.project,
      payload.newIssues
    );
    const expectedMessage = {
      text: "Snyk alert: example-org/example-name/repo:pom.xml",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*<https://app.snyk.io/org/example-org|:snyk:[example-org]>* Alerts in <https://app.snyk.io/org/example-name/project/12345|example-name/repo:pom.xml>:",
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: ":severity-high: *<https://snyk.io/vuln/SNYK-JAVA-ORGAPACHETOMCATEMBED-2414084|Privilege Escalation>* in `org.apache.tomcat.embed:tomcat-embed-core 9.0.31`",
            },
          ],
        },
      ],
    };
    expect(message).toEqual(expectedMessage);
  });
});
