let hardwareInfoLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
    // 页面切换逻辑
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有active类
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            
            // 添加当前active类
            this.classList.add('active');
            
            // 隐藏所有页面
            document.querySelectorAll('.page-container').forEach(page => {
                page.style.display = 'none';
            });
            
            // 显示当前页面
            const pageId = this.getAttribute('data-page') + '-page';
            document.getElementById(pageId).style.display = 'block';

            // 如果切换到下载页面，初始化两个部分
            if (pageId === 'download-page') {
                initDownloadPage();
                initRecoveryPage();
            }

            // 如果切换到概览页面且未加载硬件信息，则加载
            if (pageId === 'overview-page' && !hardwareInfoLoaded) {
                loadHardwareInfo();
            }
        });
    });

    // USB端口点击效果
    document.querySelectorAll('.usb-port').forEach(port => {
        port.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });

    // 监听导航事件 (从菜单栏)
    window.electronAPI.onNavigate((event, page) => {
        // 更新导航项
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
            if (nav.getAttribute('data-page') === page) {
                nav.classList.add('active');
            }
        });
        
        // 隐藏所有页面
        document.querySelectorAll('.page-container').forEach(pageEl => {
            pageEl.style.display = 'none';
        });
        
        // 显示目标页面
        document.getElementById(`${page}-page`).style.display = 'block';

        // 如果导航到下载页面，初始化两个部分
        if (page === 'download') {
            initDownloadPage();
            initRecoveryPage();
        }
    });

    // 初始化页面
    document.getElementById('overview-page').style.display = 'block';

    loadHardwareInfo();
});

let isDownloadPageInitialized = false;
let isRecoveryPageInitialized = false;

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// 初始化三分区镜像下载部分
async function initDownloadPage() {
    if (isDownloadPageInitialized) return;
    const container = document.getElementById('dmg-list-container');
    if (!container) return;
    
    // 显示加载状态
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <div>正在加载镜像列表...</div>
        </div>
    `;

    try {
        const dmgList = await window.electronAPI.getDmgList();
        if (dmgList.status === 'success') {
            renderDmgList(dmgList.data);
            isDownloadPageInitialized = true;
        } else {
            throw new Error(dmgList.message);
        }
    } catch (error) {
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <div>${error.message}</div>
                <button class="btn btn-outline retry-btn">
                    <i class="fas fa-sync-alt"></i> 重新加载
                </button>
            </div>
        `;
        document.querySelector('.retry-btn')?.addEventListener('click', initDownloadPage);
    }
}

function renderDmgList(dmgFiles, showAll = false) {
    const container = document.getElementById('dmg-list-container');
    if (!container) return;

    container.innerHTML = '';
    const visibleItems = showAll ? dmgFiles.length : Math.min(3, dmgFiles.length);

    // 创建列表容器用于动画
    const listContainer = document.createElement('div');
    listContainer.className = 'dmg-list-content';
    container.appendChild(listContainer);

    // 添加列表项（带动画）
    dmgFiles.slice(0, visibleItems).forEach((dmg, index) => {
        const item = document.createElement('div');
        item.className = 'dmg-item';
        item.style.animationDelay = `${index * 0.1}s`;
        item.innerHTML = `
            <div class="dmg-info">
                <div class="dmg-title">${dmg.title} ${dmg.version}</div>
                <div class="dmg-meta">
                    <span>版本: ${dmg.build}</span>
                    <span>大小: ${dmg.size}</span>
                    <span>发布日期: ${dmg.releaseDate}</span>
                </div>
            </div>
            <div class="dmg-actions">
                <button class="btn btn-outline copy-link" data-url="${dmg.downloadUrl}">
                    <i class="fas fa-copy"></i> 复制加密链接
                </button>
            </div>
        `;
        listContainer.appendChild(item);
    });

    // 添加折叠/展开按钮（带动画）
    if (dmgFiles.length > 3) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = `btn btn-outline toggle-list ${showAll ? 'active' : ''}`;
        toggleBtn.innerHTML = `
            <i class="fas fa-chevron-${showAll ? 'up' : 'down'}"></i> 
            ${showAll ? '收起列表' : `显示更多 (${dmgFiles.length - 3}个)`}
        `;
        toggleBtn.addEventListener('click', () => {
            listContainer.style.opacity = '0';
            setTimeout(() => {
                renderDmgList(dmgFiles, !showAll);
            }, 300);
        });
        container.appendChild(toggleBtn);
    }

    // 添加刷新按钮
    const refreshBtn = document.createElement('div');
    refreshBtn.className = 'refresh-section';
    refreshBtn.innerHTML = `
        <button class="btn btn-outline refresh-btn">
            <i class="fas fa-sync-alt"></i> 刷新列表
        </button>
    `;
    container.appendChild(refreshBtn);

    // 绑定复制按钮事件
    container.querySelectorAll('.copy-link').forEach(btn => {
        btn.addEventListener('click', async function() {
            const originalUrl = this.getAttribute('data-url');
            const originalHtml = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
            this.disabled = true;
            
            try {
                const signedUrl = await window.electronAPI.generateSignedUrl(originalUrl);
                if (signedUrl) {
                    await window.electronAPI.copyToClipboard(signedUrl);
                    showToast('<i class="fas fa-check-circle"></i> 加密链接已复制到剪贴板');
                } else {
                    throw new Error('生成失败');
                }
            } catch (error) {
                console.error('复制失败:', error);
                showToast('<i class="fas fa-exclamation-circle"></i> 生成加密链接失败', 'error');
            } finally {
                this.innerHTML = originalHtml;
                this.disabled = false;
            }
        });
    });

    // 绑定刷新按钮事件
    container.querySelector('.refresh-btn').addEventListener('click', () => {
        isDownloadPageInitialized = false;
        initDownloadPage();
    });
}

// 初始化在线恢复包部分
async function initRecoveryPage() {
    if (isRecoveryPageInitialized) return;
    const container = document.querySelector('.recovery-list');
    if (!container) return;
    
    // 显示加载状态
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <div>正在加载恢复包列表...</div>
        </div>
    `;

    try {
        const response = await fetch('https://stapi.simplehac.cn/v1/macrecovery');
        if (!response.ok) {
            throw new Error('网络响应不正常');
        }
        const recoveryList = await response.json();
        
        if (recoveryList.status === 'success') {
            renderRecoveryList(recoveryList.data);
            isRecoveryPageInitialized = true;
        } else {
            throw new Error(recoveryList.message || '获取恢复包列表失败');
        }
    } catch (error) {
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <div>${error.message}</div>
                <button class="btn btn-outline retry-btn">
                    <i class="fas fa-sync-alt"></i> 重新加载
                </button>
            </div>
        `;
        document.querySelector('.retry-btn')?.addEventListener('click', initRecoveryPage);
    }
}

function renderRecoveryList(recoveryItems, showAll = false) {
    const container = document.querySelector('.recovery-list');
    if (!container) return;

    container.innerHTML = '';
    const visibleItems = showAll ? recoveryItems.length : Math.min(3, recoveryItems.length);

    // 创建列表容器用于动画
    const listContainer = document.createElement('div');
    listContainer.className = 'recovery-list-content';
    container.appendChild(listContainer);

    // 添加列表项（带动画）
    recoveryItems.slice(0, visibleItems).forEach((item, index) => {
        const recoveryItem = document.createElement('div');
        recoveryItem.className = 'recovery-item';
        recoveryItem.style.animationDelay = `${index * 0.1}s`;
        recoveryItem.innerHTML = `
            <div class="recovery-info">
                <div class="recovery-title">${item.name}</div>
            </div>
            <div class="recovery-actions">
                <button class="btn btn-outline copy-recovery-link" data-url="${item.url}">
                    <i class="fas fa-copy"></i> 复制链接
                </button>
            </div>
        `;
        listContainer.appendChild(recoveryItem);
    });

    // 添加折叠/展开按钮（当恢复包数量超过3个时）
    if (recoveryItems.length > 3) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = `btn btn-outline toggle-list ${showAll ? 'active' : ''}`;
        toggleBtn.innerHTML = `
            <i class="fas fa-chevron-${showAll ? 'up' : 'down'}"></i> 
            ${showAll ? '收起列表' : `显示更多 (${recoveryItems.length - 3}个)`}
        `;
        toggleBtn.addEventListener('click', () => {
            listContainer.style.opacity = '0';
            setTimeout(() => {
                renderRecoveryList(recoveryItems, !showAll);
            }, 300); // 等待淡出动画完成
        });
        container.appendChild(toggleBtn);
    }

    // 添加刷新按钮
    const refreshBtn = document.createElement('div');
    refreshBtn.className = 'refresh-section';
    refreshBtn.innerHTML = `
        <button class="btn btn-outline refresh-btn">
            <i class="fas fa-sync-alt"></i> 刷新列表
        </button>
    `;
    container.appendChild(refreshBtn);

    // 绑定复制按钮事件
    container.querySelectorAll('.copy-recovery-link').forEach(btn => {
        btn.addEventListener('click', async function() {
            const url = this.getAttribute('data-url');
            try {
                await window.electronAPI.copyToClipboard(url);
                showToast('<i class="fas fa-check-circle"></i> 下载链接已复制到剪贴板');
            } catch (error) {
                console.error('复制失败:', error);
                showToast('<i class="fas fa-exclamation-circle"></i> 复制链接失败', 'error');
            }
        });
    });

    // 绑定刷新按钮事件
    container.querySelector('.refresh-btn').addEventListener('click', () => {
        isRecoveryPageInitialized = false;
        initRecoveryPage();
    });
}

// 添加硬件信息加载函数
async function loadHardwareInfo() {
    if (hardwareInfoLoaded) return;
    
    const overviewPage = document.getElementById('overview-page');
    if (!overviewPage) return;
    
    // 显示加载状态
    const cardsContainer = overviewPage.querySelector('.overview-page');
    cardsContainer.innerHTML = `
        <div class="loading-state" style="grid-column: 1 / -1;">
            <div class="spinner"></div>
            <div>正在检测硬件信息...</div>
        </div>
    `;
    
    try {
        const info = await window.electronAPI.getHardwareInfo();
        if (info.status === 'success') {
            renderHardwareInfo(info.data);
            hardwareInfoLoaded = true;
        } else {
            throw new Error(info.message || '获取硬件信息失败');
        }
    } catch (error) {
        cardsContainer.innerHTML = `
            <div class="error-state" style="grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle"></i>
                <div>${error.message}</div>
                <button class="btn btn-outline retry-btn">
                    <i class="fas fa-sync-alt"></i> 重新加载
                </button>
            </div>
        `;
        document.querySelector('.retry-btn')?.addEventListener('click', loadHardwareInfo);
    }
}

// 渲染硬件信息
function renderHardwareInfo(info) {
    const overviewPage = document.getElementById('overview-page');
    if (!overviewPage) return;
    
    const cardsContainer = overviewPage.querySelector('.overview-page');
    cardsContainer.innerHTML = '';
    
    // 系统信息卡片
    cardsContainer.appendChild(createCard(
        '系统信息',
        'fas fa-desktop',
        [
            { label: '操作系统', value: `${info.os.platform === 'darwin' ? 'macOS' : 'Windows'} ${info.os.release}` },
            { label: '系统架构', value: info.os.arch },
            { label: '系统版本', value: info.os.version || 'N/A' }
        ]
    ));
    
    // 主板信息卡片
    cardsContainer.appendChild(createCard(
        '主板',
        'fas fa-circuit-board',
        [
            { label: '制造商', value: info.system.manufacturer || '未知' },
            { label: '型号', value: info.system.model || '未知' },
            { label: '版本', value: info.system.version || 'N/A' },
            { label: '序列号', value: info.system.serial || 'N/A' }
        ]
    ));
    
    // BIOS信息卡片
    cardsContainer.appendChild(createCard(
        'BIOS',
        'fas fa-microchip',
        [
            { label: '厂商', value: info.bios.vendor || '未知' },
            { label: '版本', value: info.bios.version || 'N/A' },
            { label: '发布日期', value: info.bios.releaseDate || 'N/A' }
        ]
    ));
    
    // 处理器信息卡片
    cardsContainer.appendChild(createCard(
        '处理器',
        'fas fa-microchip',
        [
            { label: '制造商', value: info.cpu.manufacturer || '未知' },
            { label: '型号', value: info.cpu.brand || '未知' },
            { label: '主频', value: info.cpu.speed },
            { label: '最大频率', value: info.cpu.speedMax || 'N/A' },
            { label: '物理核心', value: info.cpu.physicalCores.toString() },
            { label: '逻辑核心', value: info.cpu.cores.toString() },
            { label: '插槽', value: info.cpu.socket || 'N/A' }
        ]
    ));
    
    // 内存信息卡片
    cardsContainer.appendChild(createCard(
        '内存',
        'fas fa-memory',
        [
            { label: '总容量', value: info.memory.total },
            { label: '可用内存', value: info.memory.free }
        ]
    ));
    
    // 显卡信息卡片
    const gpuCards = [];
    info.graphics.controllers.forEach((gpu, index) => {
        gpuCards.push(createCard(
            index === 0 ? '显卡' : `显卡 ${index + 1}`,
            'fas fa-video',
            [
                { label: '型号', value: gpu.name || '未知' },
                { label: '厂商', value: gpu.vendor || '未知' },
                { label: '显存', value: gpu.vram || 'N/A' },
                { label: '总线', value: gpu.bus || 'N/A' }
            ]
        ));
    });
    gpuCards.forEach(card => cardsContainer.appendChild(card));
    
    // 存储设备卡片
    const diskCards = [];
    info.disks.forEach((disk, index) => {
        diskCards.push(createCard(
            index === 0 ? '存储' : `存储 ${index + 1}`,
            'fas fa-hdd',
            [
                { label: '名称', value: disk.name || '未知' },
                { label: '类型', value: disk.type || 'N/A' },
                { label: '容量', value: disk.size },
                { label: '接口', value: disk.interfaceType || 'N/A' }
            ]
        ));
    });
    diskCards.forEach(card => cardsContainer.appendChild(card));
    
    // 网络信息卡片
    const networkCards = [];
    info.network.forEach((net, index) => {
        networkCards.push(createCard(
            index === 0 ? '网络' : `网络 ${index + 1}`,
            net.type === 'wireless' ? 'fas fa-wifi' : 'fas fa-network-wired',
            [
                { label: '接口', value: net.name || '未知' },
                { label: '类型', value: net.type === 'wireless' ? '无线' : '有线' },
                { label: 'MAC地址', value: net.mac || 'N/A' },
                { label: '速度', value: net.speed ? `${net.speed} Mbps` : 'N/A' },
                { label: 'IPv4', value: net.ip4 || 'N/A' },
                { label: 'IPv6', value: net.ip6 || 'N/A' }
            ]
        ));
    });
    networkCards.forEach(card => cardsContainer.appendChild(card));
    
    // 显示器信息卡片
    const displayCards = [];
    info.graphics.displays.forEach((display, index) => {
        displayCards.push(createCard(
            index === 0 ? '显示器' : `显示器 ${index + 1}`,
            'fas fa-tv',
            [
                { label: '型号', value: display.model || '未知' },
                { label: '厂商', value: display.vendor || '未知' },
                { label: '分辨率', value: display.resolution },
                { label: '尺寸', value: display.size }
            ]
        ));
    });
    displayCards.forEach(card => cardsContainer.appendChild(card));
    
    // 公告卡片
    const announcementCard = document.createElement('div');
    announcementCard.className = 'card announcement-card';
    announcementCard.innerHTML = `
        <div class="card-header">
            <div class="card-title">软件公告</div>
            <div class="card-icon">
                <i class="fas fa-bullhorn"></i>
            </div>
        </div>
        <div class="announcement-content">
            <p>欢迎使用 SimpleXpert 黑苹果专家工具 v1.0.0！</p>
            <p>本版本新增功能：</p>
            <ul>
                <li>支持13代Intel处理器SSDT自动生成</li>
                <li>新增USB端口一键定制功能</li>
                <li>优化了硬件信息检测准确性</li>
            </ul>
            <p>检测到您的硬件配置：${info.cpu.brand} + ${info.graphics.controllers[0]?.name || '未知显卡'}</p>
        </div>
    `;
    announcementCard.style.gridColumn = '1 / -1';
    cardsContainer.appendChild(announcementCard);
}

// 创建卡片辅助函数
function createCard(title, icon, items) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${Math.random() * 0.3}s`;
    
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    
    const cardTitle = document.createElement('div');
    cardTitle.className = 'card-title';
    cardTitle.textContent = title;
    
    const cardIcon = document.createElement('div');
    cardIcon.className = 'card-icon';
    cardIcon.innerHTML = `<i class="fas ${icon}"></i>`;
    
    cardHeader.appendChild(cardTitle);
    cardHeader.appendChild(cardIcon);
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'info-row';
        
        const label = document.createElement('span');
        label.className = 'info-label';
        label.textContent = item.label;
        
        const value = document.createElement('span');
        value.className = 'info-value';
        value.textContent = item.value;
        
        row.appendChild(label);
        row.appendChild(value);
        cardBody.appendChild(row);
    });
    
    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    
    return card;
}