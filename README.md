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
- Bun runtime compatible
- Code linting
- Typescript
- Secure Database Connection Utility
- Database Connection Pooling
- Database Query Builder
- Password Hashing & Salting
- Plugin System
- Security System
- Account Creation
- Sample Database

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

# Experimental Features
- Control Panel (WIP)

# Planned Features

# Planned Security Feature
- Anti-Proxy

# Planned Plugins
- Captcha
- Backups
- Analytics

# Steps to install, build and run
- Install
```
npm i
```
- Running
```
npm start
```

# Requirements
NodeJS v19.7.0 +

# Creating a subdomain
- Create a folder inside /src
Example: ``mynewsubdomain``
- Create routing for the newly created subdomain in app.ts under the section "Sub Domain Setup and Static Files Setup"

Example:

```js
app.use(vhost('mynewsubdomain.*.*', express.static(path.join(__dirname, '/mynewsubdomain'))));
```

# Creating a Database Connection
Required Environment Variables
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
```

# Using the query builder
```js
db.query('SELECT someRow FROM someTable WHERE someValue = ? STATEMENT', [someValue]).then((results) => {
    // Do something with results
}).catch(err) {
    logging.log.error(err);
};

```

# Creating an email connection
(Located in utils/mailer.ts)
```js
const transporter = nodemailer.createTransport({
    host: '',
    port: 465,
    secure: true,
    auth: {
        user: '',
        pass: ''
    }
});
```

# Sending an email
```js
const email = require('./utils/mailer');
email.send(_email, _2FACode);
```

# Importing the sample SQL database
Location: "src/utils/sample database/cpanel.sql"
Replace UPDATE_TO_YOUR_EMAIL_ADDRESS with your email address for the system admin account