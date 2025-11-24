import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import sudo from "sudo-prompt";
import { exec } from "node:child_process";

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

// 区分开发 / 正式：避免 dev 和 dmg 版抢同一个 wg0
const IS_DEV = !app.isPackaged || !!process.env.VITE_DEV_SERVER_URL;
const TUNNEL_NAME = IS_DEV ? "wg-dev" : "wg0";

const getConfigPath = () =>
  path.join(app.getPath("userData"), `${TUNNEL_NAME}.conf`);

// ---------- 按平台生成 WireGuard 命令 ----------
function getWireGuardCommands(configPath: string) {
  if (process.platform === "darwin") {
    // macOS: 自动探测 wg-quick 路径（Homebrew）
    let WG_QUICK_PATH = "/usr/local/bin/wg-quick";
    if (fs.existsSync("/opt/homebrew/bin/wg-quick")) {
      WG_QUICK_PATH = "/opt/homebrew/bin/wg-quick";
    }

    // 显式指定 PATH，确保用到 Homebrew 的 bash4+ / wg-quick
    const PATH_PREFIX = fs.existsSync("/opt/homebrew/bin")
      ? "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
      : "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin";

    return {
      up: `env PATH="${PATH_PREFIX}" "${WG_QUICK_PATH}" up "${configPath}"`,
      down: `env PATH="${PATH_PREFIX}" "${WG_QUICK_PATH}" down "${configPath}"`,
    };
  }

  if (process.platform === "linux") {
    const WG_QUICK_PATH = "/usr/bin/wg-quick";
    return {
      up: `"${WG_QUICK_PATH}" up "${configPath}"`,
      down: `"${WG_QUICK_PATH}" down "${configPath}"`,
    };
  }

  if (process.platform === "win32") {
    // Windows: WireGuard for Windows CLI
    const PROGRAM_FILES = process.env["PROGRAMFILES"] || "C:\\Program Files";
    const WIREGUARD_EXE = `"${PROGRAM_FILES}\\WireGuard\\wireguard.exe"`;

    return {
      up: `${WIREGUARD_EXE} /installtunnelservice "${configPath}"`,
      down: `${WIREGUARD_EXE} /uninstalltunnelservice ${TUNNEL_NAME}`,
    };
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

// ---------- 提权执行命令 ----------
// 如果进程已是 root（你用 sudo 启动整个 app），则直接 exec 不再弹密码；
// 否则使用 sudo-prompt 弹系统密码框。
function runSudoCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const isRoot =
      typeof process.getuid === "function" && process.getuid() === 0;

    if (isRoot && process.platform !== "win32") {
      console.log("runSudoCommand (as root, no prompt):", command);
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("exec error:", error, stderr);
          reject(error);
        } else {
          resolve(stdout?.toString() || "");
        }
      });
      return;
    }

    console.log("runSudoCommand (sudo-prompt):", command);
    sudo.exec(command, sudoOptions, (error, stdout) => {
      if (error) {
        console.error("Sudo Error:", error);
        reject(error);
      } else {
        resolve(stdout?.toString() || "");
      }
    });
  });
}

// 判断是否是 “已经存在” 的错误（wg0 already exists as utunX）
function isAlreadyExistsError(err: any): boolean {
  const msg = String(err?.message || err || "").toLowerCase();
  return (
    msg.includes("already exists") ||
    msg.includes("already in use") ||
    msg.includes("already exists as")
  );
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

    const { up, down } = getWireGuardCommands(configPath);

    try {
      const out = await runSudoCommand(up);
      console.log("UP output:", out);
    } catch (e) {
      if (isAlreadyExistsError(e)) {
        console.warn("检测到同名隧道已存在，尝试先 down 再 up 一次");
        try {
          await runSudoCommand(down);
        } catch (downErr) {
          console.warn("预清理 down 失败(可忽略):", downErr);
        }
        const out2 = await runSudoCommand(up);
        console.log("UP (retry) output:", out2);
      } else {
        throw e;
      }
    }

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

// ---------- 退出前自动尝试断开 ----------
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
