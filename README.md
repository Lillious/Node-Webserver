# Node-Webserver
A secure, lightweight and easy-to-use webserver powered by ExpressJS

# Features
- Support for subdomains
- Cluster module
- Support for multiple file types (adjustable in package.json)
- Code minification
- Request/File Caching
- Express file compression
- Blazingly fast and lightweight
- Bun runtime compatibility
- Secure Database Connection Utility
- Database Connection Pooling
- Database Query Builder
- Password Hashing & Salting
- Plugin System
- Security System
- Login System
- Account Registration
- Web Server Settings
- Sample Database
- Maintenance Mode Banner
- Multidomain Support

# Security Features
- CORS
- CSRF Protection
- XSS Protection
- HSTS
- Content Security Policy
- Rate Limiting
- HTTP Parameter Pollution Protection
- SQL Injection Protection
- Authenticated / Unauthenticated Routes
- Database SSL Support
- Robot.txt Support
- Anti-Scrape
- Automated Attack Detection
- Bot Detection
- Token stealing prevention
- Email based 2FA /w resend option
- Email based password Reset
- Permission System
- Job Scheduler System
- Null Routing (DDoS mitigation)
- IP Blocking
- IP Whitelist

# Scheduled Jobs
- Backups
- Clear Expired Login Sessions

# Experimental Features
- Control Panel (WIP)

# Node Version Requirement
NodeJS v20.0.0 +

# Used Environment Variables
```
DATABASE_HOST
DATABASE_USER
DATABASE_PASSWORD
DATABASE_PORT
DATABASE_NAME
EMAIL_HOST
EMAIL_PORT
EMAIL_SECURE
EMAIL_USER
EMAIL_PASSWORD
EMAIL_SERVICE
SESSION_KEY
```

# Creating a subdomain
- Create a folder inside /src
Example: ``mynewsubdomain``
- Create routing for the newly created subdomain in app.ts under the section "Sub Domain Setup and Static Files Setup"

Example:

```js
app.use(vhost('mynewsubdomain.*.*', express.static(path.join(__dirname, '/mynewsubdomain'))));
```

# Adding additional domains
(Located in app.ts)

Update the following array with the corresponding domains that you'd like to host.
```js
const domains: string[''] = [];
```
Once the domain is added to the array, create a folder in src/ with the name matching the domain.
An index.html file is required at the root directory.

Example:
```js
const domains: string['mydomain.com'] = [];
```
Folder: src/mydomain.com


# Using the query builder
```js
query('SELECT someRow FROM someTable WHERE someValue = ?', [someValue]).then((results) => {
    // Do something with results
}).catch(err) {
    logging.log.error(err);
};

```

# Creating an email connection
(Located in utils/mailer.ts)
```js
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_USER,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
```

# Sending an email
```js
const email = require('./utils/mailer');
email.send(email: string, subject: string, message: string);
```

# Creating a scheduled job
(Located in src/jobs/jobs.ts)
```js
myFirstJob: {
    name: string,
    enabled: boolean,
    interval: number.
    start() {
        // Code to execute
    }
}
```

# Whitelisting / Blacklisting an IP
```js
const ips = require('../utils/ipservice');
// Add to Blacklist
ips.service.blacklistAdd(ip: string);
// List Blacklisted IPs
const b_ips = ips.service.getBlacklistedIPs();
// Add to Whitelist
ips.service.whitelistAdd(ip: string);
// List Whitelisted IPs
const w_ips = ips.service.getWhitelistedIPs();
```
