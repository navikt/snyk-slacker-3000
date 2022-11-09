const { sendAlert } = require("./slack");

function logMessage(message, level) {
  console.log(new Date().toISOString(), `[${level}] ${message}`);
  if (level !== "debug") {
    sendAlert(message, level);
  }
}

module.exports = {
  error: (message) => logMessage(message, "error"),
  warn: (message) => logMessage(message, "warn"),
  success: (message) => logMessage(message, "success"),
  info: (message) => logMessage(message, "info"),
  debug: (message) => logMessage(message, "debug"),
};
