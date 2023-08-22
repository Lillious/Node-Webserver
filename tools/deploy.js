import Cleanup from "./cleanup.js";
import Copy from "./copy.js";
import path from "path";

console.log("Starting deployment");
Cleanup(path.join(process.cwd(), 'dist', 'src')).then(() => {
    // Create the dist/src folder
    Copy(path.join(process.cwd(), 'src'), path.join(process.cwd(), 'dist', 'src')).then(() => {
        console.log('Deployment complete');
    }).catch((err) => {
        throw new Error(err);
    });
}).catch((err) => {
    throw new Error(err);
});