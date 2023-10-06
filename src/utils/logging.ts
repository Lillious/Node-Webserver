import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const info = (message: string) => {
  const log = `${timestamp()} - \x1b[32m${message}\x1b[0m`;
  console.log(log);
  WriteLogFile(message);
};

export const error = (message: string) => {
  const log = `${timestamp()} - \x1b[31m${message}\x1b[0m`;
  console.error(log);
  WriteLogFile(message);
};

export const warn = (message: string) => {
  const log = `${timestamp()} - \x1b[33m${message}\x1b[0m`;
  console.warn(log);
  WriteLogFile(message);
};

export const debug = (message: string) => {
  const log = `${timestamp()} - \x1b[34m${message}\x1b[0m`;
  console.debug(log);
  WriteLogFile(message);
};

const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir);
  } catch (err) {
    error("Failed to create log directory");
  }
}

const timestamp = () => {
  return new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
};

function WriteLogFile(message: string) {
  try {
    fs.appendFileSync(
      path.join(__dirname, "../logs/debug.log"),
      `<b>${timestamp()}</b> - ${message}\n`
    );
  } catch (err) {
    error("Failed to write to debug.log");
  }
}
