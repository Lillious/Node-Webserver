# Node-Webserver
An easy-to-use webserver powered by Node and ExpressJS

# Features
- Adjustable Rate limiting
- Support for subdomains
- Cluster based multi threading
- Support for multiple file types (adjustable in package.json)
- Api path at /api
- Code minifier
- Request/File Caching
- Express file compression

# Steps to install, build and run
- Install
```
npm i
```
- Build
```
npm run build
```
- Start
```
npm start
```
# Creating a subdomain
- Create a folder inside /src
Example: ``mynewsubdomain``
- Create routing for the newly created subdomain in app.ts under the section "Sub Domain Setup and Static Files Setup"

Example:

```js
app.use(vhost('mynewsubdomain.*.*', express.static(path.join(__dirname, '/mynewsubdomain'))));
```
