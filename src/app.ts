import dotenv from "dotenv";
dotenv.config();
import express from "express";
import compression from "compression";
const app = express();
import path from "node:path";
import logger from "morgan";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import http from "node:http";
import https from "node:https";
import cluster from "node:cluster";
import os from "node:os";
import { rateLimit } from "express-rate-limit";
import vhost from "vhost";
import hpp from "hpp";
import * as log from "./utils/logging.js";
import * as email from "./utils/mailer.js";
import fs from "node:fs";
import * as authentication from "./utils/authentication.js";
import query from "./utils/database.js";
import { hash, randomBytes } from "./utils/hash.js";
const port = process.env.PORT || 80;
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { service } from "./utils/ipservice.js";
import { addSecurityRule, removeSecurityRule } from "./utils/security.js";

/* Certificate Setup */
const _cert = path.join(__dirname, "../certs/cert.crt");
const _ca = path.join(__dirname, "../certs/cert.ca-bundle");
const _key = path.join(__dirname, "../certs/cert.key");
let _https = false;

if (fs.existsSync(_cert) && fs.existsSync(_ca) && fs.existsSync(_key)) {
  _https = true;
}

const cert = _https ? fs.readFileSync(_cert, "utf8") : "";
const ca = _https ? fs.readFileSync(_ca, "utf8") : "";
const key = _https ? fs.readFileSync(_key, "utf8") : "";

const credentials = {
  cert: cert,
  ca: ca,
  key: key,
};

/* File Uploads */
import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../files"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  dest: path.join(__dirname, "../files"),
  storage: storage,
  limits: {
    fileSize: 1e10,
  },
  fileFilter: function (req, file, cb) {
    // const types = [
    //     'image/png',
    //     'image/jpeg',
    //     'image/gif'
    // ];

    // if (!types.includes(file.mimetype)) {
    //     return cb(new Error('Only images are allowed'));
    // }

    cb(null, true);
  },
});

// Plugins
import filter from "./plugins/security.js";
import { redirect, removeRedirect, addRedirect } from "./utils/redirect.js";
import { getSetting, updateSetting } from "./utils/settings.js";

// View Engine Setup
app.use(logger("dev"));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(cookieParser());
app.use(compression());
app.disable("x-powered-by");
app.use(hpp());
// Session Setup
app.use(
  cookieSession({
    name: "session",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: "/",
    domain: "*.*",
    keys: [process.env.SESSION_KEY || "secret"],
  })
);
// Trust Proxy Setup
app.set("trust proxy", 1);
// Sub Domain Setup and Static Files Setup
app.set("subdomain offset", 1);
// Rate Limiting Setup
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
});
app.use(limiter);
// Server Setup
app.set("port", port);
const server = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

// Cluster Setup
if (cluster.isPrimary) {

  // Test Database Connection
  query("SELECT 1 + 1 AS solution").then(() => {
    log.info(`Database Connection Successful`);
  }).catch((err: any) => {
    log.error(`Database Connection Failed With ${err}`);
  });

  if (!_https) {
    log.error(
      "SSL disabled - No certificates found or invalid certificates found in /certs"
    );
  } else {
    log.info("SSL enabled");
  }
  // Job System
  import("./utils/jobs.js");

  // Fork workers
  for (let i = 0; i < os.availableParallelism(); i++) {
    cluster.fork();
  }
  // If a worker dies, create a new one to replace it
  cluster.on("exit", (worker: any) => {
    log.error(`worker ${worker.process.pid} died` + "\n" + "Restarting...");
    cluster.fork();
  });
} else {
  server
    .listen(port, () => {
      if (cluster?.worker?.id === 1) {
        log.info(`HTTP Server listening on port ${port}`);
      }
    })
    .on("error", (error: any) => {
      if (error.syscall !== "listen") {
        throw error;
      }
      const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

      switch (error.code) {
        case "EACCES":
          log.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case "EADDRINUSE":
          log.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  if (_https) {
    httpsServer
      .listen(443, () => {
        if (cluster?.worker?.id === 1) {
          log.info(`HTTPS Server listening on port 443`);
        }
      })
      .on("error", (error: any) => {
        if (error.syscall !== "listen") {
          throw error;
        }
        const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

        switch (error.code) {
          case "EACCES":
            log.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
          case "EADDRINUSE":
            log.error(`${bind} is already in use`);
            process.exit(1);
            break;
          default:
            throw error;
        }
      });
  }
}

// Email validation
function validateEmail(email: string) {
  const re = /\S+@\S+\.\S+/;
  const re2 = /\S+%40\S+\.\S+/;
  if (re.test(email) || re2.test(email)) return true;
  return false;
}

// Redirect all http requests to https if https is enabled
if (_https) {
  app.use((req: any, res: any, next: any) => {
    if (!req.secure) {
      res.redirect("https://" + req.headers.host + req.url);
    } else {
      next();
    }
  });
}

// Filter
app.use(function (req: any, res: any, next: any) {
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-access-token"
  );
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  filter(req, res, next, ip);
});

// Redirects
app.use(function (req: any, res: any, next: any) {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  redirect(req, res, next);
});

// Check if the url has repeating slashes at the end of the domain
app.use(function (req: any, res: any, next: any) {
  let url = req.url;
  if (url.match(/\/{2,}$/)) {
    // Remove repeating slashes at the end of the domain
    url = url.replace(/\/{2,}$/g, "/");
    // Redirect to the new url
    res.redirect(
      `${req.headers["x-forwarded-proto"] || req.protocol}://${
        req.headers.host
      }${url}`
    );
  } else {
    next();
  }
});

/* Start Unsecure Routing */
/* Routes that do not require authentication */

// Files middleware for secure files
app.use("/files/secure", (req: any, res: any) => {
  res.sendFile(path.join(__dirname, "../www/public/errors/403.html"));
});

// Initially Deny Access to Registration Page
app.use("/register", (req: any, res: any) => {
  getSetting("registration").then((value: any) => {
    if (value === "true") {
      res.status(200);
      res.sendFile(path.join(__dirname, "../www/public/register/index.html"));
    } else {
      res.status(404);
      res.sendFile(path.join(__dirname, "../www/public/errors/404.html"));
    }
  });
});

// Files route
app.use(
  "/files",
  express.static(path.join(__dirname, "../files"), {
    maxAge: 0,
  })
);

// Login Page Route
app.use(
  "/login",
  express.static(path.join(__dirname, "../www/public/login/"), {
    maxAge: 2.88e7,
  })
);

// Root directory
app.use(
  "/",
  express.static(path.join(__dirname, "../www/public/"), {
    maxAge: 2.88e7,
  })
);

// Root subdomain
app.use(
  vhost(
    "*.*",
    express.static(path.join(__dirname, "../www/public/"), {
      maxAge: 2.88e7,
    })
  )
);

// Localhost root directory
app.use(
  vhost(
    "localhost",
    express.static(path.join(__dirname, "../www/public/"), {
      maxAge: 2.88e7,
    })
  )
);

// Reject root subdomain requests if they aren't being redirected
app.use(
  vhost("*.*.*", (req: any, res: any, next: any) => {
    return;
  })
);

// Login
app.post("/login", (req: any, res: any) => {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  res.clearCookie("session");
  res.clearCookie("email");
  const body = req.body;
  if (body.email && body.password) {
    if (!validateEmail(body.email)) {
      res.clearCookie("session");
      res.clearCookie("email");
      res.status(401).send("Unauthorized");
      return;
    }
    res.cookie("email", body.email, {
      maxAge: 86400000,
      httpOnly: true,
    });
    query("SELECT * FROM accounts WHERE email = ? AND password = ?", [
      body.email.toLowerCase(),
      hash(body.password),
    ])
      .then((results: any) => {
        if (results.length === 0) {
          res.clearCookie("session");
          res.clearCookie("email");
          res.status(401).send("Unauthorized");
          return;
        }
        if (results[0].passwordreset == "1") {
          res.status(403).send("Password Reset Required");
          return;
        }
        query("UPDATE accounts SET lastlogin = ? WHERE email = ?", [
          new Date(),
          body.email.toLowerCase(),
        ])
          .then(() => {
            createSession(req, res, body.email.toLowerCase());
          })
          .catch((err: any) => {
            log.error(err);
          });
      })
      .catch((err: any) => {
        log.error(err);
        res.clearCookie("session");
        res.clearCookie("email");
        res.status(500).send("Internal Server Error");
        return;
      });
  } else {
    res.clearCookie("session");
    res.clearCookie("email");
    res.status(401).send("Unauthorized");
    return;
  }
});

// Register
app.post("/registration", (req: any, res: any) => {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  getSetting("registration").then((value: any) => {
    if (value != "true") return res.redirect("/login");
  });
  const body = req.body;
  if (body.email && body.password && body.password2) {
    // Check if the passwords match
    if (body.password !== body.password2) {
      res.status(401).send("Unauthorized");
      return;
    }
  } else {
    res.status(401).send("Unauthorized");
    return;
  }

  // Check if the email is valid
  if (!validateEmail(body.email)) return res.status(401).send("Unauthorized");
  // Check if the email is already in use
  query("SELECT * FROM accounts WHERE email = ?", [body.email.toLowerCase()])
    .then((results: any) => {
      if (results.length > 0) return res.status(401).send("Unauthorized");
    })
    .catch((err: any) => {
      log.error(err);
      res.status(500).send("Internal Server Error");
      return;
    });

  // Create the account and send the user to the 2fa page
  query("INSERT INTO accounts (email, password, lastlogin) VALUES (?, ?, ?)", [
    body.email.toLowerCase(),
    hash(body.password),
    new Date(),
  ])
    .then(() => {
      res.cookie("email", body.email.toLowerCase(), {
        maxAge: 86400000,
        httpOnly: true,
      });
      createSession(req, res, body.email.toLowerCase());
    })
    .catch((err: any) => {
      log.error(err);
      res.status(500).send("Internal Server Error");
      return;
    });
});

// 2FA
app.post("/2fa", (req: any, res: any) => {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  const body = req.body;
  // Verify session and email cookies exist
  if (!req.cookies.session || !req.cookies.email) return res.redirect("/login");
  // Check if the email is valid
  if (!validateEmail(req.cookies.email)) return res.stat;
  authentication
    .checkCode(req.cookies.email, body.code)
    .then((results: any) => {
      if (!results) return res.status(401).send("Unauthorized");
      query("UPDATE sessions SET code = ? WHERE email = ?", [
        "0",
        req.cookies.email,
      ])
        .then(() => {
          res.status(200).send("OK");
        })
        .catch((err: any) => {
          log.error(err);
        });
    })
    .catch((err: any) => {
      log.error(err);
      res.status(500).send("Internal Server Error");
    });
});

// Reset Password
app.post("/api/reset-password", (req: any, res: any) => {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  console.log("Tried");
  const body = req.body;
  if (!body.temppassword || !body.password1 || !body.password2)
    return res.status(401).send("Unauthorized");
  if (body.password1 !== body.password2)
    return res.status(401).send("Unauthorized");
  query("SELECT passwordreset FROM accounts WHERE email = ? AND password = ?", [
    req.cookies.email,
    hash(body.temppassword),
  ])
    .then((results: any) => {
      if (results[0].passwordreset === "1") {
        query(
          "UPDATE accounts SET password = ?, passwordreset = ? WHERE email = ?",
          [hash(body.password1), "0", req.cookies.email]
        )
          .then(() => {
            log.info(`[PASSWORD RESET] ${req.cookies.email}`);
            createSession(req, res);
          })
          .catch((err: any) => {
            log.error(err);
            res.status(500).send("Internal Server Error");
          });
      } else {
        res.redirect("/login");
      }
    })
    .catch((err: any) => {
      log.error(err);
      res.status(500).send("Internal Server Error");
    });
});

// Resend 2FA Code
app.post("/2fa/resend", (req: any, res: any) => {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  createSession(req, res, req.cookies.email);
});

/* Start Secure Routing */
/* Routes that require authentication */

// Authented Routes Middleware
app.use(function (req: any, res: any, next: any) {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  // Verify session and email cookies exist
  if (!req.cookies.session || !req.cookies.email) return res.redirect("/login");
  // Check if the email is valid
  if (!validateEmail(req.cookies.email)) return res.redirect("/login");
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  authentication
    .checkSession(req.cookies.session, ip)
    .then((results: any) => {
      if (!results) return res.redirect("/login");
      authentication
        .checkCode(req.cookies.email, "0")
        .then((results: any) => {
          if (!results) return res.redirect("/login");
          next();
        })
        .catch(() => {
          return res.redirect("/login");
        });
    })
    .catch(() => {
      res.redirect("/login");
    });
});

// Cpanel Route
app.use(
  "/cpanel",
  express.static(path.join(__dirname, "../www/cpanel/root/"), {
    maxAge: 2.88e7,
  })
);

// File browser Route
app.use(
  "/cpanel/browser",
  express.static(path.join(__dirname, "../www/cpanel/browser"), {
    maxAge: 2.88e7,
  })
);

// Users Route
app.use(
  "/cpanel/users",
  express.static(path.join(__dirname, "../www/cpanel/users"), {
    maxAge: 2.88e7,
  })
);

// Logs Route
app.use(
  "/cpanel/logs",
  express.static(path.join(__dirname, "../www/cpanel/logging"), {
    maxAge: 2.88e7,
  })
);

// Security Definitions Route
app.use(
  "/cpanel/security",
  express.static(path.join(__dirname, "../www/cpanel/security"), {
    maxAge: 2.88e7,
  })
);

// Redirect rules Route
app.use(
  "/cpanel/redirects",
  express.static(path.join(__dirname, "../www/cpanel/redirects"), {
    maxAge: 2.88e7,
  })
);

// Blocked IPs Route
app.use(
  "/cpanel/blocked-ips",
  express.static(path.join(__dirname, "../www/cpanel/blocked-ips"), {
    maxAge: 2.88e7,
  })
);

// Toggle registration
app.post("/api/toggle-registration", (req: any, res: any) => {
  authentication
    .checkAccess(req.cookies.email)
    .then((results: any) => {
      if (results === 1) {
        getSetting("registration").then((value: any) => {
          if (value === "true") {
            updateSetting("registration", "false");
            log.warn("[Registration] - Disabled");
          } else {
            updateSetting("registration", "true");
            log.warn("[Registration Mode] - Enabled");
          }
        });
        res.redirect("back");
      } else {
        res.redirect("/cpanel");
      }
    })
    .catch((err: any) => {
      log.error(err);
      res.status(500).send("Internal Server Error");
    });
});

// Add Redirect
app.post("/api/redirect-rule", (req: any, res: any) => {
  authentication
    .checkAccess(req.cookies.email)
    .then((results: any) => {
      if (results === 1) {
        const body = req.body;
        if (!body.url || !body.redirect) {
          log.error(`[Redirect] - INVALID_REDIRECT`);
          return res.status(500).send("Internal Server Error");
        }
        if (
          !body.url
            .replace(/\/$/, "")
            .startsWith(req.headers.host.replace(/\/$/, ""))
        ) {
          log.error(
            `[Redirect] - Redirect URI must start with ${req.headers.host}`
          );
          return res.status(500).send("Internal Server Error");
        }
        if (
          body.redirect
            .replace(/\/$/, "")
            .startsWith(req.headers.host.replace(/\/$/, ""))
        ) {
          log.error(`[Redirect] - Redirect URI cannot have the host domain`);
          return res.status(500).send("Internal Server Error");
        }
        addRedirect(body.url, body.redirect)
          .then(() => {
            res.status(200).send("OK");
          })
          .catch((err: any) => {
            log.error(err);
            res.status(500).send("Internal Server Error");
          });
      } else {
        res.status(403).send("Forbidden");
      }
    })
    .catch((err: any) => {
      log.error(err);
      res.status(500).send("Internal Server Error");
    });
});

// Remove Redirect
app.delete("/api/redirect-rule", (req: any, res: any) => {
  authentication
    .checkAccess(req.cookies.email)
    .then((results: any) => {
      if (results === 1) {
        const body = req.body;
        removeRedirect(body.url)
          .then(() => {
            log.info(`[Redirect Removed] - ${body.url}`);
            res.status(200).send("OK");
          })
          .catch((err: any) => {
            log.error(err);
            res.status(500).send("Internal Server Error");
          });
      } else {
        res.status(403).send("Forbidden");
      }
    })
    .catch((err: any) => {
      log.error(err);
    });
});

// Get Redirects
app.get("/api/redirect-rule", (req: any, res: any) => {
  authentication
    .checkAccess(req.cookies.email)
    .then((results: any) => {
      if (results === 1) {
        const file = fs.readFileSync(
          path.join(__dirname, "../config/redirects.cfg"),
          "utf8"
        );
        const rows: string[] = [];
        file.split("\n").forEach((line: any) => {
          if (!line.startsWith("#") || line === "") {
            rows.push(line);
          }
        });
        res.send(rows);
      } else {
        res.status(403).send("Forbidden");
      }
    })
    .catch((err: any) => {
      log.error(err);
    });
});

// Logout
app.post("/logout", (req: any, res: any) => {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  query("DELETE FROM sessions WHERE session = ?", [req.cookies.session])
    .then(() => {
      log.error(`[LOGOUT] ${req.cookies.email}`);
      res.clearCookie("session");
      res.clearCookie("email");
      res.redirect("/login");
    })
    .catch((err: any) => {
      log.error(err);
      res.redirect("/login");
    });
});

// Get Current User Info
app.get("/api/@me", (req: any, res: any) => {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  query("SELECT email FROM accounts WHERE email = ?", [req.cookies.email])
    .then((results: any) => {
      if (results.length > 0) {
        res.status(200).send(results[0]);
      } else {
        res.status(404).send("Not Found");
      }
    })
    .catch((err: any) => {
      log.error(err);
      res.status(500).send("Internal Server Error");
    });
});

// Get Users
app.get("/api/user", (req: any, res: any) => {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  authentication
    .checkAccess(req.cookies.email)
    .then((results: any) => {
      if (results === 1) {
        query("SELECT * FROM accounts")
          .then((results: any) => {
            res.send(results);
          })
          .catch((err: any) => {
            log.error(err);
            res.status(500).send("Internal Server Error");
          });
      } else {
        res.status(403).send("Forbidden");
      }
    })
    .catch((err: any) => {
      log.error(err);
    });
});

// Remove User
app.delete("/api/user", (req: any, res: any) => {
  authentication
    .checkAccess(req.cookies.email)
    .then((results: any) => {
      if (results === 1) {
        query("DELETE FROM accounts WHERE email = ?", [req.body.email])
          .then((results: any) => {
            if (results.affectedRows === 1) {
              res.status(200).send("OK");
            } else {
              res.status(404).send("Not Found");
            }
          })
          .catch((err: any) => {
            log.error(err);
            res.status(500).send("Internal Server Error");
          });
      } else {
        res.status(403).send("Forbidden");
      }
    })
    .catch((err: any) => {
      log.error(err);
    });
});

// Create Account
app.post("/api/create-account", (req: any, res: any) => {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  const body = req.body;
  if (!body.email) return res.redirect(path.join(__dirname, "back"));
  // Check access
  authentication
    .checkAccess(req.cookies.email)
    .then((results: any) => {
      if (results === 1) {
        // Check if account already exists by email
        query("SELECT email FROM accounts WHERE email = ?", [body.email])
          .then((results: any) => {
            if (results.length === 0) {
              const password = randomBytes(8);
              query(
                "INSERT INTO accounts (email, password, passwordreset) VALUES (?, ?, ?)",
                [body.email, hash(password), "1"]
              )
                .then(() => {
                  log.info(`[CREATE ACCOUNT] ${body.email}`);
                  email.send(
                    body.email,
                    "Account Created",
                    `Your account has been created. Your temporary password is ${password}. Please login to your account ${req.protocol}://${req.headers.host}/login and change your password.`
                  );
                  res.redirect("back");
                })
                .catch((err: any) => {
                  log.error(err);
                  res.status(500).send("Internal Server Error");
                });
            } else {
              log.error(`[CREATE ACCOUNT] ${body.email} already exists`);
              res.redirect("back");
            }
          })
          .catch((err: any) => {
            log.error(err);
            res.status(500).send("Internal Server Error");
          });
      } else {
        log.error(`[CREATE ACCOUNT] ${req.cookies.email} does not have access`);
        res.redirect("back");
      }
    })
    .catch((err: any) => {
      log.error(err);
      res.redirect("back");
    });
});

// Reset Password
app.post("/reset-password", (req: any, res: any) => {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  if (!req.cookies.session || !req.cookies.email) return res.redirect("/login");
  const session = randomBytes(64);
  const temp = shuffle(session, 8);
  query("UPDATE accounts SET password = ?, passwordreset = ? WHERE email = ?", [
    hash(temp),
    "1",
    req.cookies.email,
  ])
    .then(() => {
      email.send(
        req.cookies.email,
        "Password Reset",
        `Your temporary password is: ${temp}`
      );
      res.sendFile(
        path.join(__dirname, "..", "www/public/login/passwordreset.html")
      );
    })
    .catch((err: any) => {
      log.error(err);
      res.redirect("/login");
    });
});

// Get Server Info
app.get("/api/serverinfo", (req: any, res: any) => {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  const serverinfo = {
    ip: req.socket.remoteAddress,
    directory: path.basename(__dirname),
    domain: req.headers.host,
    protocol: req.headers["x-forwarded-proto"] || req.protocol,
  };
  res.status(200).send(serverinfo);
});

// Get File Usage
app.get("/api/fileusage", (req: any, res: any) => {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  fs.statfs("/", (err: any, stats: any) => {
    const data = {
      total: stats.blocks * stats.bsize,
      free: stats.bfree * stats.bsize,
      used: (stats.blocks - stats.bfree) * stats.bsize,
    };
    res.status(200).send(data);
  });
});

// Get Logs
app.get("/api/logs", (req: any, res: any) => {
  authentication
    .checkAccess(req.cookies.email)
    .then((results: any) => {
      if (results === 1) {
        const file = fs.readFileSync(
          path.join(__dirname, "./logs/debug.log"),
          "utf8"
        );
        const rows: string[] = [];
        const lines = file.split("\n");
        const start = lines.length > 50 ? lines.length - 50 : 0;
        for (let i = start; i < lines.length; i++) {
          if (!lines[i].startsWith("#") || lines[i] === "") {
            rows.push(lines[i]);
          }
        }
        res.send(rows);
      } else {
        res.status(403).send("Forbidden");
      }
    })
    .catch((err: any) => {
      log.error(err);
    });
});

// Get Server Version
app.get("/api/version", (req: any, res: any) => {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  try {
    const file = fs.readFileSync(
      path.join(__dirname, "../package.json"),
      "utf8"
    );
    const json = JSON.parse(file);
    const result = {
      version: json.version,
    };
    res.status(200).send(result);
  } catch (err: any) {
    log.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// Get Files
app.get("/api/file", (req: any, res: any) => {
  authentication
    .checkAccess(req.cookies.email)
    .then((results: any) => {
      if (results === 1) {
        const _files: string[] = [];
        fs.readdir(path.join(__dirname, "../files"), (err: any, files: any) => {
          if (err) {
            log.error(err);
            res.status(500).send("Internal Server Error");
          } else {
            files.forEach((file: any) => {
              if (file === "secure") return;
              const stats = fs.statSync(path.join(__dirname, "../files", file));
              const size = formatFileSize(stats.size) as string;
              _files.push({ name: file, size: `${size}` } as any);
            });
          }
          res.send(_files);
        });
      } else {
        res.status(403).send("Forbidden");
      }
    })
    .catch((err: any) => {
      log.error(err);
    });
});

// Upload File
app.post("/api/file", (req: any, res: any) => {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  if (!req.cookies.session || !req.cookies.email) return res.redirect("/login");
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      log.error(err);
      return res.status(500).send("Internal Server Error");
    } else {
      return res.status(200).send("OK");
    }
  });
});

// Remove File
app.delete("/api/file", (req: any, res: any) => {
  authentication
    .checkAccess(req.cookies.email)
    .then((results: any) => {
      if (results === 1) {
        // Check if the file exists
        if (fs.existsSync(path.join(__dirname, "../files", req.body.file))) {
          // Remove it
          fs.unlinkSync(path.join(__dirname, "../files", req.body.file));
          if (fs.readdirSync(path.join(__dirname, "../files")).length === 0) {
            res.status(201).send("OK");
          } else {
            res.status(200).send("OK");
          }
        } else {
          res.status(404).send("Not Found");
        }
      } else {
        res.status(403).send("Forbidden");
      }
    })
    .catch((err: any) => {
      log.error(err);
    });
});

// Format file size
function formatFileSize(bytes: number) {
  if (bytes >= 1e9) {
    // If size is greater than or equal to 1 GB
    return (bytes / 1e9).toFixed(2) + " GB"; // Convert to GB and round to 2 decimal places
  } else if (bytes >= 1e6) {
    // If size is greater than or equal to 1 MB
    return (bytes / 1e6).toFixed(2) + " MB"; // Convert to MB and round to 2 decimal places
  } else {
    return (bytes / 1e3).toFixed(2) + " KB"; // Convert to KB and round to 2 decimal places
  }
}

// Get Security Definitions
app.get("/api/security-definition", (req: any, res: any) => {
  authentication
    .checkAccess(req.cookies.email)
    .then((results: any) => {
      if (results === 1) {
        const file = fs.readFileSync(
          path.join(__dirname, "../config/security.cfg"),
          "utf8"
        );
        const rows: string[] = [];
        file.split("\n").forEach((line: any) => {
          if (!line.startsWith("#") || line === "") {
            rows.push(line);
          }
        });
        res.send(rows);
      } else {
        res.status(403).send("Forbidden");
      }
    })
    .catch((err: any) => {
      log.error(err);
    });
});

app.delete("/api/security-definition", (req: any, res: any) => {
  authentication
    .checkAccess(req.cookies.email)
    .then((results: any) => {
      const body = req.body;
      if (results === 1) {
        if (!body.rule) return res.status(500).send("Internal Server Error");
        removeSecurityRule(body.rule)
          .then(() => {
            res.status(200).send("OK");
          })
          .catch((err: any) => {
            log.error(err);
            res.status(500).send("Internal Server Error");
          });
      } else {
        res.status(403).send("Forbidden");
      }
    })
    .catch((err: any) => {
      log.error(err);
    });
});

app.post("/api/security-definition", (req: any, res: any) => {
  authentication
    .checkAccess(req.cookies.email)
    .then((results: any) => {
      const body = req.body;
      if (results === 1) {
        if (!body.rule) return res.status(500).send("Internal Server Error");
        addSecurityRule(body.rule)
          .then(() => {
            res.status(200).send("OK");
          })
          .catch((err: any) => {
            log.error(err);
            res.status(500).send("Internal Server Error");
          });
      } else {
        res.status(403).send("Forbidden");
      }
    })
    .catch((err: any) => {
      log.error(err);
    });
});

// Get Blocked IPs
app.get("/api/blocked-ip", (req: any, res: any) => {
  authentication
    .checkAccess(req.cookies.email)
    .then((results: any) => {
      const rows: string[] = [];
      if (results === 1) {
        query("SELECT * FROM blocked_ips")
          .then((results: any) => {
            const start = results.length > 100 ? results.length - 100 : 0;
            for (let i = start; i < results.length; i++) {
              rows.push(results[i].ip);
            }
            res.send(rows);
          })
          .catch((err: any) => {
            log.error(err);
            res.status(500).send("Internal Server Error");
          });
      } else {
        res.status(403).send("Forbidden");
      }
    })
    .catch((err: any) => {
      log.error(err);
    });
});

// Remove Blocked IP
app.delete("/api/blocked-ip", (req: any, res: any) => {
  authentication
    .checkAccess(req.cookies.email)
    .then((results: any) => {
      if (results === 1) {
        query("DELETE FROM blocked_ips WHERE ip = ?", [req.body.ip])
          .then((results: any) => {
            if (results.affectedRows === 1) {
              service.blacklistRemove(req.body.ip);
              log.info(`[BLOCKED IP REMOVED] - ${req.body.ip}`);
              res.status(200).send("OK");
            } else {
              res.status(404).send("Not Found");
            }
          })
          .catch((err: any) => {
            log.error(err);
            res.status(500).send("Internal Server Error");
          });
      } else {
        res.status(403).send("Forbidden");
      }
    })
    .catch((err: any) => {
      log.error(err);
    });
});

// Redirect to root domain if route is not found
app.use(function (req: any, res: any) {
  res.setHeader("Cache-Control", "public, max-age=2.88e+7");
  if (req.originalUrl === "/") {
    res.redirect("/login");
    return;
  }
  res
    .status(404)
    .sendFile(path.join(__dirname, "../www/public/errors/404.html"));
});

function shuffle(str: string, length: number) {
  length = length || 6;
  const arr = str.split("");
  let n = arr.length;
  while (n > 0) {
    const i = Math.floor(Math.random() * n--);
    const tmp = arr[n];
    arr[n] = arr[i];
    arr[i] = tmp;
  }
  return arr.join("").slice(0, length).toUpperCase();
}

function createSession(req: any, res: any, _email?: string) {
  _email = _email || req.cookies.email;
  if (!_email) return res.redirect("/login");
  authentication
    .checkAccess(_email)
    .then((results: any) => {
      if (results === -1) {
        res.clearCookie("email");
        res.clearCookie("session");
        res.status(403);
        res.sendFile(path.join(__dirname, "../www/public/errors/403.html"));
        return;
      } else {
        query("SELECT email FROM accounts WHERE email = ?", [_email])
          .then((results: any) => {
            if (results.length === 0) return res.redirect("/login");
            // Delete any existing sessions
            query("DELETE FROM sessions WHERE email = ?", [_email])
              .then(() => {
                const session = randomBytes(64);
                const ip =
                  req.headers["x-forwarded-for"] ||
                  req.connection.remoteAddress;
                const code = shuffle(session, 6);
                query(
                  "INSERT INTO sessions (session, email, ip, code, created) VALUES (?, ?, ?, ?, ?)",
                  [session, _email, ip, code, new Date()]
                )
                  .then(() => {
                    res.cookie("session", session, {
                      maxAge: 86400000,
                      httpOnly: true,
                    });
                    const ip =
                      req.headers["x-forwarded-for"] ||
                      req.connection.remoteAddress;
                    log.info(`[LOGIN] ${_email} - IP: ${ip}`);
                    if (_email)
                      email.send(
                        _email,
                        "Verification Code",
                        `Your verification code is: ${code}`
                      );
                    res.redirect("/login/2fa.html");
                  })
                  .catch((err: any) => {
                    log.error(err);
                  });
              })
              .catch((err: any) => {
                log.error(err);
                res.status(500).send("Internal Server Error");
              });
          })
          .catch((err: any) => {
            log.error(err);
            res.status(500).send("Internal Server Error");
          });
      }
    })
    .catch((err: any) => {
      log.error(err);
      res.redirect("/login");
    });
}
