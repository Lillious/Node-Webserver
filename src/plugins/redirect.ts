const redirects = [
    ["localhost/test/", "localhost/login/"],
];

export default function redirect (req: any, res: any, next: any): void {
    const url = `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers.host}${req.url}`;
    for (const redirect of redirects) {
        if (url === `${req.headers['x-forwarded-proto'] || req.protocol}://${redirect[0]}`) {
            res.redirect(`${req.headers['x-forwarded-proto'] || req.protocol}://${redirect[1]}`);
            return;
        }
    }
    next();
}