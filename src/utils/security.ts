import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as readline from "node:readline/promises";
import * as log from "./logging.js";
const security = path.join(__dirname, "..", "..", "config", "security.cfg");

if (!fs.existsSync(path.join(__dirname, "..", "..", "config")))
  fs.mkdirSync(path.join(__dirname, "..", "..", "config"));
if (!fs.existsSync(security)) {
  fs.writeFileSync(security, "# Security Definitions\n");
}

export function checkSecurityRule(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(security),
    });
    rl.on("line", (rule: string) => {
      if (rule.startsWith("#")) return;
      if (url === rule) resolve(true);
    })
      .on("close", () => {
        reject("NOT_FOUND");
      })
      .on("error", (err: any) => {
        log.error(err);
        reject("Error reading security.cfg");
      });
  });
}

export function addSecurityRule(rule: string): Promise<any> {
  return new Promise((resolve, reject) => {
    checkSecurityRule(rule)
      .then(() => {
        reject("Rule already exists");
      })
      .catch(() => {
        // Check if file ends in newline
        fs.readFile(security, (err: any, data: Buffer) => {
          if (err) {
            log.error(err);
            reject("Error reading security.cfg");
          }
          if (!data.toString().endsWith("\n")) rule = "\n" + rule;
          fs.appendFile(security, rule + "\n", (err: any) => {
            if (err) {
              log.error(err);
              reject("Error writing to security.cfg");
            }
            resolve(true);
          });
        });
      });
  });
}

export function removeSecurityRule(rule: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(security),
    });
    const lines: string[] = [];
    rl.on("line", (line: string) => {
      if (line.startsWith("#")) return;
      if (line !== rule) lines.push(line);
    })
      .on("close", () => {
        fs.writeFile(security, lines.join("\n"), (err: any) => {
          if (err) {
            log.error(err);
            reject("Error writing to security.cfg");
          }
          resolve(true);
        });
      })
      .on("error", (err: any) => {
        log.error(err);
        reject("Error reading security.cfg");
      });
  });
}
