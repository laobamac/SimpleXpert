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