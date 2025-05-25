const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const DmgHandler = require('./dmgHandler');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets/icons/icon.ico')
  });

  // 加载应用界面
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 开发模式下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // 创建应用菜单
  createAppMenu();

  // 窗口关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 创建应用菜单
function createAppMenu() {
  const template = [
    {
      label: 'SimpleXpert',
      submenu: [
        { 
          label: '关于 SimpleXpert',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate-to', 'about');
            }
          }
        },
        { type: 'separator' },
        { 
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 当Electron完成初始化时创建窗口
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用（包括macOS）
app.on('window-all-closed', () => {
  app.quit();
});

// IPC通信处理窗口控制
ipcMain.on('window-control', (event, action) => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;

  switch (action) {
    case 'minimize':
      win.minimize();
      break;
    case 'maximize':
      win.isMaximized() ? win.unmaximize() : win.maximize();
      break;
    case 'close':
      // 所有平台都直接退出应用
      app.quit();
      break;
  }
});

ipcMain.handle('copy-to-clipboard', async (event, text) => {
    const { clipboard } = require('electron');
    clipboard.writeText(text);
});

ipcMain.handle('get-dmg-list', async () => {
    const dmgHandler = new DmgHandler(mainWindow);
    return await dmgHandler.getDmgList();
});

ipcMain.handle('generate-signed-url', async (event, url) => {
    try {
        const dmgHandler = new DmgHandler(mainWindow);
        return await dmgHandler.generateSignedUrl(url);
    } catch (error) {
        console.error('生成签名URL失败:', error);
        return null;
    }
});

ipcMain.handle('get-hardware-info', async () => {
  try {
    const os = require('os');
    const si = require('systeminformation');
    
    // 获取基础系统信息
    const system = await si.system();
    const bios = await si.bios();
    const cpu = await si.cpu();
    const mem = await si.mem();
    const graphics = await si.graphics();
    const diskLayout = await si.diskLayout();
    const networkInterfaces = await si.networkInterfaces();
    
    // 处理网络接口信息
    const network = networkInterfaces
      .filter(iface => !iface.internal)
      .map(iface => ({
        name: iface.ifaceName,
        type: iface.type,
        mac: iface.mac,
        speed: iface.speed,
        ip4: iface.ip4,
        ip6: iface.ip6
      }));
    
    // 处理磁盘信息
    const disks = diskLayout.map(disk => ({
      name: disk.name,
      type: disk.type,
      size: (disk.size / (1024 ** 3)).toFixed(2) + ' GB',
      interfaceType: disk.interfaceType
    }));
    
    // 处理显卡信息
    const gpus = graphics.controllers.map(gpu => ({
      name: gpu.model,
      vendor: gpu.vendor,
      vram: gpu.vram ? (gpu.vram / 1024).toFixed(2) + ' GB' : 'N/A',
      bus: gpu.bus
    }));
    
    // 处理显示器信息
    const displays = graphics.displays.map(display => ({
      model: display.model,
      resolution: `${display.resolutionX}x${display.resolutionY}`,
      vendor: display.vendor,
      size: display.sizeX && display.sizeY 
        ? `${Math.sqrt(display.sizeX**2 + display.sizeY**2).toFixed(1)} inch` 
        : 'N/A'
    }));
    
    return {
      status: 'success',
      data: {
        os: {
          platform: os.platform(),
          release: os.release(),
          arch: os.arch(),
          version: os.version()
        },
        system: {
          manufacturer: system.manufacturer,
          model: system.model,
          version: system.version,
          serial: system.serial,
          uuid: system.uuid,
          sku: system.sku
        },
        bios: {
          vendor: bios.vendor,
          version: bios.version,
          releaseDate: bios.releaseDate,
          revision: bios.revision
        },
        cpu: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          speed: cpu.speed + ' GHz',
          speedMax: cpu.speedMax + ' GHz',
          cores: cpu.cores,
          physicalCores: cpu.physicalCores,
          processors: cpu.processors,
          socket: cpu.socket,
          cache: cpu.cache
        },
        memory: {
          total: (mem.total / (1024 ** 3)).toFixed(2) + ' GB',
          free: (mem.free / (1024 ** 3)).toFixed(2) + ' GB'
        },
        graphics: {
          controllers: gpus,
          displays: displays
        },
        disks: disks,
        network: network
      }
    };
  } catch (error) {
    console.error('获取硬件信息失败:', error);
    return {
      status: 'error',
      message: '无法获取硬件信息: ' + error.message
    };
  }
});

// 安全处理 - 确保只允许加载本地内容
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
});