## Node Webserver
Experience the power of ExpressJS with this secure and easy-to-use web server. Designed to be lightweight and efficient, it delivers lightning-fast performance and unparalleled security.

<br>

## Supported Node Version

```
NodeJS v20.2.0+
```

<br>

## Features
- Support for subdomains and multidomains
- Cluster module for efficient performance
- Flexible support for multiple file types
- Code minification and Express file compression
- Request and file caching for faster load times
- Secure database connection utility with pooling and query builder
- Password hashing and salting for enhanced security
- Plugin system and maintenance mode banner
- Login system and account registration
- Web server settings and blazing-fast, lightweight performance
- Sample database included
- Control panel
- User settings

<br>

## Security Features
- CORS, CSRF, XSS, SQL injection protection
- HSTS, content security policy, rate limiting
- HTTP parameter pollution protection, null routing for DDoS mitigation
- Anti-scrape, bot detection, IP blocking, IP whitelisting
- Token stealing prevention, email-based 2FA and password reset
- Authenticated/unauthenticated routes, permission system
- Job scheduler system, database SSL support, robot.txt support
- Automated attack detection

<br>

## Scheduled Jobs
- Configurable Backups
- Clear Expired Login Sessions

<br>

## Database Environment Variables
```
DATABASE_HOST
DATABASE_USER
DATABASE_PASSWORD
DATABASE_PORT
DATABASE_NAME
```

<br>

## Email Service Environment Variables
```
EMAIL_USER
EMAIL_PASSWORD
EMAIL_SERVICE
```

<br>

## Other Environment Variables
```
SESSION_KEY
NODE_ENV=development (required for local testing)
NODE_ENV=production (production only / external)
```

<br>

## Creating a subdomain
Location: src/app.ts

To create a subdomain, you need to create a new folder in the `/src` directory and then set up routing for the subdomain in the `app.ts` file.
Add a new line of code to the section to set up routing for your new subdomain. The code should look like this:

```js
app.use(vhost('mynewsubdomain.*.*', express.static(path.join(__dirname, '/mynewsubdomain'))));
```

<br>

## Adding additional domains
Location: src/app.ts

The following code defines an array of domains that can be hosted by the application. To add a new domain, the `domains` array must be updated with the new domain's name. Additionally, a folder with the same name as the domain must be created in the `src/` directory, and an `index.html` file must be placed in the root directory of the new folder.

```js
const domains: string['mydomain.com, example.com'] = [];
```
```
├── src/
│   ├── mydomain.com/
│   │   └── index.html
│   └── example.com/
│       └── index.html
```

<br>

## Function: query(sql: string, values?: any): Promise<any>

This function executes a SQL query on a database and returns a Promise that resolves to the query result.

### Parameters

- `sql` (string): The SQL query to execute.
- `values` (optional): An array of values to substitute into the query, if any. If not specified, no substitution is performed.

### Returns

- A Promise that resolves to the result of the query.

### Usage

To use this function, import it and call it with the SQL query as the first argument and an optional array of values as the second argument:

```js
import query from './query';

// Execute a simple query with no parameters
query('SELECT * FROM users')
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error(error);
  });

// Execute a parameterized query with values
query('SELECT * FROM users WHERE id = ?', [123])
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error(error);
  });
```
<br>
<br>

## Creating an email connection
Location: src/utils/mailer.ts
```js
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_USER,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
```
This code sets up a nodemailer transporter object that uses the email service specified in the EMAIL_SERVICE environment variable. It also provides authentication information for the email account using the EMAIL_USER and EMAIL_PASS environment variables.

Note that you will need to set the EMAIL_USER and EMAIL_PASS environment variables with the appropriate values for your email account.

<br>

## Sending an email
To send an email using `nodemailer`, you need to use the `email.send()` method provided in the `mailer.ts` file.

### Usage
```js
const email = require('./utils/mailer');
email.send(email: string, subject: string, message: string);
```

<br>

## Creating a scheduled job
Location: src/jobs/jobs.ts
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
Here, myFirstJob is the name of the job object that you want to create. You can replace it with a name of your choice. The name property is a string that describes the job. The enabled property is a boolean that specifies whether the job is enabled or disabled. The interval property is a number that represents the time interval at which the job will execute. The start() function is the code that will be executed when the job is started.

<br>

## Redirects
Location src/plugins/redirect.ts
```js
// Add redirect rules in the section below
// http and https protocols are dynamic so the domain and path is the only information needed
const redirects = [
    ["localhost/test/", "localhost/login/"],
];
```