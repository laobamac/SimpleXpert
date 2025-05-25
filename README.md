# <div align="center"><img src="https://img.wjwj.top/2025/05/25/69f795c3fecc1fb0a2de050f910fa3d8.png" width="400"></div>

SimpleXpert 是一款专业的黑苹果(Hackintosh)工具集，旨在简化黑苹果安装和配置过程。提供从硬件检测到系统配置的一站式解决方案。

------
技术栈：![windows](https://img.shields.io/badge/windows-0078D6?logo=windows&logoColor=white) ![macos](https://img.shields.io/badge/macOS-000000?logo=macos) ![Python](https://img.shields.io/badge/Python-14354C.svg?logo=python&logoColor=white) ![HTML5](https://img.shields.io/badge/HTML5-E34F26.svg?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6.svg?logo=css3&logoColor=white) ![Github](https://img.shields.io/badge/Github-100000.svg?logo=github&logoColor=white) ![VSCode](https://img.shields.io/badge/VSCode-007ACC?logo=visual-studio-code&logoColor=white) ![VueJS](https://img.shields.io/badge/Vue.js-35495e.svg?logo=vue.js&logoColor=4FC08D) ![Node](https://img.shields.io/badge/Node.js-43853D.svg?logo=node.js&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-323330.svg?logo=javascript&logoColor=F7DF1E) ![electron](https://img.shields.io/badge/Electron-FFFFFF?logo=electron)
------

## 🚀 功能概览

| 功能模块       | 主要特性                                                                 |
|----------------|--------------------------------------------------------------------------|
| 🖥️ 硬件检测     | 全面检测CPU/GPU/内存/磁盘等硬件信息                                      |
| 🔧 SSDT定制     | 自动生成适合您硬件的SSDT补丁                                             |
| 🔌 USB定制      | 可视化USB端口管理，确保黑苹果系统下USB设备正常工作                       |
| ⬇️ 镜像下载     | 提供macOS安装镜像和恢复包下载                                            |
| 🛠️ 工具集       | 包含多种黑苹果实用工具                                                   |

## 📦 安装方法

### 预编译版本
从 [Releases 页面](https://github.com/yourusername/SimpleXpert/releases) 下载对应系统的安装包。

### 从源码构建
```bash
# 克隆仓库
git clone https://github.com/yourusername/SimpleXpert.git
cd SimpleXpert

# 安装依赖
npm install

# 开发模式运行
npm start

# 构建应用 (Windows)
npm run build:win

# 构建应用 (macOS)
npm run build:mac
```

## 🧩 功能详解

### 硬件信息检测
- 处理器：型号、核心数、频率、缓存等
- 显卡：型号、显存、厂商等
- 内存：容量、频率等
- 存储：磁盘型号、容量、接口类型等
- 网络：网卡型号、MAC地址、IP等

### SSDT热补丁
支持自动生成以下常见补丁：
- `SSDT-PLUG` - CPU电源管理
- `SSDT-AWAC` - 系统时钟修复
- `SSDT-EC-USBX` - 嵌入式控制器
- `SSDT-PMC` - NVRAM支持
- 此处不一一列出

### USB端口定制
```
1. 扫描USB端口
2. 选择需要启用的端口
3. 导出USBMap.kext
```

### 辅助工具集
| 工具名称       | 功能描述                     |
|----------------|-----------------------------|
| DMG烧录        | 将DMG镜像写入U盘             |
| EDID提取       | 提取显示器EDID信息           |
| 三码生成       | 生成随机的SMBIOS三码         |
-----------------------------------------------
**不一一列出，仍处于开发阶段，详细功能请等待Release说明**

## 🛠️ 技术栈

- **核心框架**: Electron 25+
- **UI组件**: 纯CSS实现，无第三方UI库（借鉴Vue3结构，未直接调用）
- **构建工具**: electron-builder 24+

## 📜 开发指南

### 项目结构
```
src/
├── main            # 主进程代码
├── renderer        # 渲染进程代码
preload.js          # 预加载脚本
```

### 开发规范
1. 使用ES6+语法
2. 组件样式使用CSS变量
3. IPC通信通过预加载脚本
4. 重要函数添加JSDoc注释

## ❓ 常见问题

### 硬件检测相关问题
**Q: 某些硬件信息显示不正确**  
A: 尝试以管理员权限运行程序，或手动补充信息。

### 安装相关问题
**Q: 构建失败**  
A: 确保已安装所有依赖：
```bash
npm install --save-dev electron electron-builder axios tar systeminformation
```

## 📄 许可证

MIT License © 2025 laobamac

---

<div align="center">
感谢所有黑苹果社区的贡献者！🍎
</div>
