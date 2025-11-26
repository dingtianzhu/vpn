// src/data/servers.ts
import type { ServerNode } from "../types";

export const SERVER_LIST: ServerNode[] = [
  {
    id: "us-ny",
    country: "United States",
    city: "New York",
    flag: "🇺🇸",
    ping: 145,
    baseConfig: `
[Interface]
PrivateKey = 8KhqVpaQ+hdUqP6deAz/NSZfXtp30xqdakECeYR70EI=
Address = 10.66.66.2/32
DNS = 1.1.1.1
MTU = 1280

[Peer]
PublicKey = jbjrwioxyN9k7KoQCpO3Y9me3Sg5SXRU9fvuIelF6gM=
Endpoint = 47.88.55.204:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
`.trim(),
  },
];
