const log = require("./log");

const mappingByOrg = {};

require("../config.json").forEach((config) => {
  const { snykOrg } = config;
  if (mappingByOrg[snykOrg]) {
    log.warn(`Multiple configs found for org ${snykOrg}`);
  }
  mappingByOrg[snykOrg] = config;
});

function getConfigForOrg(snykOrg) {
  return mappingByOrg[snykOrg];
}

function getAllConfigs() {
  return Object.values(mappingByOrg);
}

function getAllConfigsByOrg() {
  return mappingByOrg;
}

module.exports = {
  getConfigForOrg,
  getAllConfigs,
  getAllConfigsByOrg,
};
