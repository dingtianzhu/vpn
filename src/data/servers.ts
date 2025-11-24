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
PrivateKey = sPUIqUyJf7HT1rSofRJUd8OYFlZIfDuB+qTMKrag+3M=
Address = 10.66.66.2/32
DNS = 1.1.1.1,1.0.0.1
MTU = 1280

[Peer]
PublicKey = C/21VKfLcCy7Xi8NviEvMP0o1A2jyYBooe/xeOzPi1k=
PresharedKey = TR5FO72qLYVjRwGSeT/n3S4NH08zmj/uw7Hs50uN2qk=
Endpoint = 47.88.55.204:62635
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
`.trim(),
  },
];
