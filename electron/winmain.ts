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

const sudoOptions = { name: "MyVPN Client" };

// 统一的隧道名和配置文件名
const TUNNEL_NAME = "wg0";
const getConfigPath = () =>
  path.join(app.getPath("userData"), `${TUNNEL_NAME}.conf`);

// ---------- 不同平台组装不同命令 ----------
function getWireGuardCommands(configPath: string) {
  if (process.platform === "darwin" || process.platform === "linux") {
    // macOS / Linux 使用 wg-quick
    // ⚠️ 用你的实际路径替换。mac 上可在终端执行 `which wg-quick` 查看
    const WG_QUICK_PATH = "/usr/local/bin/wg-quick";
    return {
      up: `"${WG_QUICK_PATH}" up "${configPath}"`,
      down: `"${WG_QUICK_PATH}" down "${configPath}"`,
    };
  }

  if (process.platform === "win32") {
    // Windows 使用 WireGuard for Windows 自带的 CLI
    // 默认安装路径：C:\Program Files\WireGuard\wireguard.exe
    // 如果你安装在其他位置，请同步改这里
    const PROGRAM_FILES = process.env["PROGRAMFILES"] || "C:\\Program Files";
    const WIREGUARD_EXE = `"${PROGRAM_FILES}\\WireGuard\\wireguard.exe"`;

    return {
      // 安装并启动隧道服务（要求管理员权限）
      up: `${WIREGUARD_EXE} /installtunnelservice "${configPath}"`,
      // 卸载隧道服务（隧道名就是 wg0）
      down: `${WIREGUARD_EXE} /uninstalltunnelservice ${TUNNEL_NAME}`,
    };
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

// ---------- 提权执行命令（sudo-prompt 会在 Win 上弹 UAC，在 mac 上弹密码框） ----------
function runSudoCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log("runSudoCommand:", command);
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

// ---------- IPC: 连接 ----------
async function handleConnect(
  event: IpcMainInvokeEvent,
  configContent: string
): Promise<string> {
  try {
    if (!configContent || !configContent.includes("[Interface]")) {
      throw new Error("WireGuard 配置内容为空或格式不正确");
    }

    const configPath = getConfigPath();
    fs.writeFileSync(configPath, configContent);

    const { up } = getWireGuardCommands(configPath);
    console.log("UP command:", up);
    const out = await runSudoCommand(up);
    console.log("UP output:", out);

    event.sender.send("vpn:status-changed", "connected");
    return "connected";
  } catch (error: any) {
    console.error("连接失败:", error);
    const msg = String(error?.message || error);
    throw new Error(msg);
  }
}

// ---------- IPC: 断开 ----------
async function handleDisconnect(event: IpcMainInvokeEvent): Promise<string> {
  try {
    const configPath = getConfigPath();
    const { down } = getWireGuardCommands(configPath);
    console.log("DOWN command:", down);
    const out = await runSudoCommand(down);
    console.log("DOWN output:", out);

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
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
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

// 退出前尝试自动断开
app.on("before-quit", async (event) => {
  if (isQuitting) return;
  isQuitting = true;

  event.preventDefault();
  try {
    const configPath = getConfigPath();
    const { down } = getWireGuardCommands(configPath);
    console.log("App 退出前执行:", down);
    await runSudoCommand(down);
  } catch (e) {
    console.warn("退出时关闭 WireGuard 失败(可忽略):", e);
  } finally {
    app.exit();
  }
});

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
