import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import sudo from "sudo-prompt";

// ---------- 基础路径 ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.APP_ROOT = path.join(__dirname, "..");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

const sudoOptions = { name: "VPN Client" };

// 动态获取配置路径，避免 app.getPath 过早调用
const getConfigPath = () => path.join(app.getPath("userData"), "wg0.conf");

// ---------- 提权执行命令 ----------
function runSudoCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    sudo.exec(command, sudoOptions, (error, stdout, stderr) => {
      if (error) {
        console.error("Sudo Error:", error);
        reject(error);
      } else {
        resolve(stdout?.toString() || "");
      }
    });
  });
}

// ---------- 连接 VPN ----------
async function handleConnect(
  event: IpcMainInvokeEvent,
  configContent: string
): Promise<string> {
  try {
    if (!configContent || !configContent.includes("[Interface]")) {
      throw new Error("WireGuard 配置内容为空或格式不正确");
    }

    const CONFIG_PATH = getConfigPath();
    fs.writeFileSync(CONFIG_PATH, configContent);

    // 根据你机器的实际路径修改：
    // Intel 常见路径：/usr/local/bin/wg-quick
    // Apple Silicon：/opt/homebrew/bin/wg-quick
    const WG_QUICK_PATH = "/usr/local/bin/wg-quick";

    const cmd = `${WG_QUICK_PATH} up "${CONFIG_PATH}"`;
    console.log("正在执行:", cmd);
    const out = await runSudoCommand(cmd);
    console.log(out);

    event.sender.send("vpn:status-changed", "connected");
    return "connected";
  } catch (error: any) {
    console.error("连接失败:", error);
    const msg = String(error?.message || error);
    throw new Error(msg);
  }
}

// ---------- 断开 VPN ----------
async function handleDisconnect(event: IpcMainInvokeEvent): Promise<string> {
  try {
    const CONFIG_PATH = getConfigPath();
    const WG_QUICK_PATH = "/usr/local/bin/wg-quick";
    const cmd = `${WG_QUICK_PATH} down "${CONFIG_PATH}"`;

    console.log("正在断开:", cmd);
    const out = await runSudoCommand(cmd);
    console.log(out);

    event.sender.send("vpn:status-changed", "disconnected");
    return "disconnected";
  } catch (error) {
    console.error("断开失败(可能已经断开):", error);
    event.sender.send("vpn:status-changed", "disconnected");
    return "disconnected";
  }
}

// ---------- 创建窗口 ----------
let win: BrowserWindow | null = null;
let isQuitting = false;

function createWindow() {
  const preloadPath = path.join(__dirname, "preload.cjs");
  console.log("✅ Loading preload from:", preloadPath);

  win = new BrowserWindow({
    width: 900,
    height: 670,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  ipcMain.handle("vpn:connect", handleConnect);
  ipcMain.handle("vpn:disconnect", handleDisconnect);

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// ---------- 退出前自动 down ----------
app.on("before-quit", async (event) => {
  if (isQuitting) return;
  isQuitting = true;

  event.preventDefault();
  try {
    const CONFIG_PATH = getConfigPath();
    const WG_QUICK_PATH = "/usr/local/bin/wg-quick";
    const cmd = `${WG_QUICK_PATH} down "${CONFIG_PATH}"`;

    console.log("App 即将退出，执行:", cmd);
    await runSudoCommand(cmd);
  } catch (e) {
    console.warn("退出时关闭 WireGuard 失败(可忽略):", e);
  } finally {
    app.exit();
  }
});

// ---------- 生命周期 ----------
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
