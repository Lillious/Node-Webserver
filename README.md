## Node Webserver
Experience the power of ExpressJS with this secure and easy-to-use web server. Designed to be lightweight and efficient, it delivers lightning-fast performance and unparalleled security.

![Teaser 1](https://github.com/Lillious/Node-Webserver/blob/main/teasers/teaser1.png?raw=true)
![Teaser 2](https://github.com/Lillious/Node-Webserver/blob/main/teasers/teaser2.png?raw=true)
## Supported Node Version

```
NodeJS v20.6.0+
```
## Features
- Support for subdomains and multidomains
- Cluster module for efficient performance
- Flexible support for multiple file types
- Code minification and Express file compression
- Request and file caching for faster load times
- Secure database connection utility with pooling and query builder
- Plugin system
- Login system and account registration
- Web server settings
- Sample database included
- Mobile Optimized control panel
- Registration system
- Job scheduler system
- SSL Certificate support

## Security Features
- CORS, CSRF, XSS, SQL injection protection
- HSTS, content security policy, rate limiting
- HTTP parameter pollution protection, null routing for DDoS mitigation
- Anti-scrape, bot detection, IP blocking, IP whitelisting
- Session hijack prevention
- email-based 2FA
- Authenticated/unauthenticated routes, permission system
- robot.txt support
- Password hashing and salting for enhanced security
- Post runtime file tamper detection / notification system

## Scheduled Jobs
- Configurable Automated Backups
- Clear Expired Login Sessions

## Permission Levels
```
(-1)    banned     Can {  }                          Cannot { Access, View, Modify }

(0)     user       Can { Access }                    Cannot { View, Modify }

(1)     admin      Can { Access, View, Modify }      Cannot {  }
```

## Database Environment Variables
```
DATABASE_HOST
DATABASE_USER
DATABASE_PASSWORD
DATABASE_PORT
DATABASE_NAME
```

## Email Service Environment Variables
```
EMAIL_USER
EMAIL_PASSWORD
EMAIL_SERVICE
EMAIL_ALERTS
```

## Other Environment Variables
```
SESSION_KEY
NODE_ENV (development | production)
```

## Enabling SSL
Location src/app.ts
```ts
/* Certificate Setup */
const _cert = path.join(__dirname, '../certs/cert.crt');
const _ca = path.join(__dirname, '../certs/cert.ca-bundle');
const _key = path.join(__dirname, '../certs/cert.key');
```

## Creating a subdomain (DNS required)
Location: src/app.ts

To create a subdomain, you need to create a new folder in the `www` directory and then set up routing for the subdomain in the `app.ts` file.
Add a new line of code to the section to set up routing for your new subdomain. The code should look like this:

```ts
app.use(vhost('mynewsubdomain.*.*', express.static(path.join(__dirname, '/www/mynewsubdomain'))));
```

## Function: query(sql: string, values?: any): Promise<any>

This function executes a SQL query on a database and returns a Promise that resolves to the query result.

### Parameters

- `sql` (string): The SQL query to execute.
- `values` (optional): An array of values to substitute into the query, if any. If not specified, no substitution is performed.

### Returns

- A Promise that resolves to the result of the query.

### Usage

To use this function, import it and call it with the SQL query as the first argument and an optional array of values as the second argument:

```ts
import query from './utils/database.js';

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

## Creating an email connection
Location: src/utils/mailer.ts
```ts
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_USER,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
```
This code sets up a nodemailer transporter object that uses the email service specified in the ``EMAIL_SERVICE`` environment variable. It also provides authentication information for the email account using the ``EMAIL_USER`` and ``EMAIL_PASS`` environment variables.

Note that you will need to set the ``EMAIL_USER`` and ``EMAIL_PASS`` environment variables with the appropriate values for your email account.
## Sending an email
To send an email using `nodemailer`, you need to use the `email.send()` method provided in the `mailer.ts` file.

### Usage
```ts
import * as email from './utils/mailer.js';
email.send(email: string, subject: string, message: string);
```

## Creating a scheduled job
Location: src/jobs/jobs.ts
```ts
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

## Redirects
Location: config/redirects.cfg

Adding/removing a redirect programmatically
```ts
import { addRedirect, removeRedirect } from './plugins/redirect.js';
addRedirect(from: string, to: string);
removeRedirect(from: string);
```

## Settings
Location: config/settings.cfg

### Update Settings
```ts
import { updateSetting } from './utils/settings.js';
updateSetting(setting: string, value: any);
```

### Check Settings Value
```ts
import { getSetting } from './utils/settings.js';
getSetting(setting: string).then((value: any) => {
  // Do something if the value exists
}).catch(err: any) {
  log.error(err);
});
```

## Security Definitions
Location: config/security.cfg
This file contains a list of commonly used attack vectors that determine malformed requests
Example:
```
.env
.aws
wp-admin
shell
wget
curl
showLogin.cc
```

## Files
Location: /files
Secure Location: /files/secure
You can choose to files to the directories above.
Publicly accessible files can be accessed at files.yourdomain.com(DNS required) or yourdomain.com/files
Secure files that are not accessible by any means and just live on the server as a storage device are located in the Secure Location directory.