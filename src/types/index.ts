export type VpnStatus = "disconnected" | "connecting" | "connected";
export type PageId = "home" | "servers" | "settings";

export interface VPNSettings {
  mtu: number;
  dnsMode: "cloudflare" | "google" | "custom";
  customDns: string;
}

export interface ServerNode {
  id: string;
  country: string;
  city: string;
  flag: string;
  ping: number;
  baseConfig: string; // 带占位符 __DNS__ / __MTU__ 的 WireGuard 配置模板
}
