# Node-Webserver
An easy-to-use webserver powered by ExpressJS

# Features
- Support for subdomains
- Cluster module
- Support for multiple file types (adjustable in package.json)
- Code minification
- Request/File Caching
- Express file compression
- Blazingly fast and light weight
- Bun runtime compatible
- Code linting
- Typescript
- Secure Database Connection Utility
- Database Connection Pooling
- Database Query Builder
- Password Hashing & Salting

# Security Features
- HelmetJS
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

# Experimental Features
- Control Panel (WIP)

# Planned Features
- Plugin System
- Robot.txt Support
- Bot Detection
- Sample Database

# Planned Security Features
- Anti-Scrape
- Anti-Proxy
- Automated Attack Detection
- Null Routing (DDOS Protection)

# Planned Plugins
- Captcha
- Backups
- Analytics
- File Manager

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
