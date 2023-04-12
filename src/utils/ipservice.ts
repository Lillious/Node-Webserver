class BlackListService {
    constructor(private ips: string[] = []) {}

    add(ip: string): number {
        return this.ips.push(ip);
    }

    getIPs(): string[] {
        return this.ips;
    }
}

export const bservice: BlackListService = new BlackListService();

class WhiteListService {
    constructor(private ips: string[] = []) {}

    add(ip: string): number {
        return this.ips.push(ip);
    }

    getIPs(): string[] {
        return this.ips;
    }
}

export const wservice: WhiteListService = new WhiteListService();