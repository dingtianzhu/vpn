// src/data/servers.ts

export interface ServerNode {
  id: string;
  country: string;
  city: string;
  flag: string;
  ping: number;
  config: string; // 完整 WireGuard 客户端配置
}
// sudo ufw status 62635
// root@iZrj9cmu2h748u74exzcw5Z:~# cat /root/wg0-client-mytest.conf
// [Interface]
// PrivateKey = 打码
// Address = 10.66.66.2/32,fd42:42:42::2/128
// DNS = 1.1.1.1,1.0.0.1

// # Uncomment the next line to set a custom MTU
// # This might impact performance, so use it only if you know what you are doing
// # See https://github.com/nitred/nr-wg-mtu-finder to find your optimal MTU
// # MTU = 1420

// [Peer]
// PublicKey = 打码
// PresharedKey = 打码
// Endpoint = 172.18.10.135:62635
// AllowedIPs = 0.0.0.0/0,::/0
export const SERVER_LIST: ServerNode[] = [
  {
    id: "us-ny",
    country: "United States",
    city: "New York",
    flag: "🇺🇸",
    ping: 145,
    config: `
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
