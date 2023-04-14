class IpService {
    constructor(private allowed_ips: string[] = [], private blocked_ips: string[] = []) {}

    whitelistAdd(ip: string): number {
        return this.allowed_ips.push(ip);
    }

    getWhitelistedIPs(): string[] {
        return this.allowed_ips;
    }

    blacklistAdd(ip: string): number {
        return this.blocked_ips.push(ip);
    }

    getBlacklistedIPs(): string[] {
        return this.blocked_ips;
    }
}

export const service: IpService = new IpService();