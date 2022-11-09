const { getAllConfigsByOrg } = require("../src/config");

const allSeverities = ["low", "medium", "high", "critical"];
const allIssueTypes = ["vuln", "license"];

describe("iac-configuration", () => {
  const configMap = getAllConfigsByOrg();

  Object.entries(configMap).forEach(([name, config]) => {
    test(`Configuration for ${name}`, () => {
      expect(config.snykOrg).toBeTruthy();
      expect(config.slackChannelId).toMatch(/^[CG][A-Z0-9]+$/);

      expect(config.severity).toBeTruthy();
      expect(config.issueType).toBeTruthy();

      config.severity.forEach((s) => expect(allSeverities).toContain(s));
      config.issueType.forEach((t) => expect(allIssueTypes).toContain(t));
    });
  });
});
