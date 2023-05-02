const timestamp = () => {
    return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
};

export const info = (message: string) => console.log(`${timestamp()} \x1b[32m${message}\x1b[0m`);
export const error = (message: string) => console.error(`${timestamp()} \x1b[31m${message}\x1b[0m`);
export const warn = (message: string) => console.warn(`${timestamp()} \x1b[33m${message}\x1b[0m`);
export const debug = (message: string) => console.debug(`${timestamp()} \x1b[34m${message}\x1b[0m`);