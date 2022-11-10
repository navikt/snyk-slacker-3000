const fs = require("fs");
const { env } = require("process");

const log = require("./log");

const mappingByOrg = {};

const defaultPathToConf = "./config.json";
const pathToConf = env.CONF_LOCATION || defaultPathToConf;
if (!fs.existsSync(pathToConf)) {
  throw `cannot find config at at the default location '${defaultPathToConf}' or at $CONF_LOCATION ('${process.env.CONF_LOCATION}')`;
}

JSON.parse(fromLocalFile(pathToConf)).forEach((config) => {
  const { snykOrg } = config;
  if (mappingByOrg[snykOrg]) {
    log.warn(`Multiple configs found for org ${snykOrg}`);
  }
  mappingByOrg[snykOrg] = config;
});

function fromLocalFile(path) {
  return fs.readFileSync(path);
}

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
