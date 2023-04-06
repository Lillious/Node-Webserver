class BlackListService {
    constructor(private ips: string[] = []) {}

    add(ip: string): number {
        return this.ips.push(ip);
    }

    getIPs(): string[] {
        return this.ips;
    }
}

export const service: BlackListService = new BlackListService();