// src/dmgHandler.js
const axios = require('axios');
const crypto = require('crypto');
const { URL } = require('url');

class DmgHandler {
    constructor(window) {
        this.window = window;
        this.aesKey = null;
    }

    async _getAesKey() {
        try {
            const response = await axios.get('https://oclpapi.simplehac.cn/DMG/aeskey.php', {
                timeout: 10000,
                headers: {
                    'User-Agent': 'SimpleToolkit/1.0',
                    'Accept': 'text/plain'
                }
            });

            const aesKey = response.data.trim();
            if (!aesKey) throw new Error('获取的AES密钥为空');
            return aesKey;
        } catch (error) {
            console.error(`获取AES密钥失败: ${error.message}`);
            return null;
        }
    }

    async getDmgList() {
        try {
            const response = await axios.get('https://oclpapi.simplehac.cn/DMG?token=oclpmod', {
                timeout: 10000,
                headers: {
                    'User-Agent': 'SimpleToolkit/1.0',
                    'Accept': 'application/json'
                }
            });

            const data = response.data;
            if (!data) return { status: 'error', message: 'API返回空数据' };
            
            return data.dmgFiles 
                ? { status: 'success', data: data.dmgFiles }
                : { status: 'error', message: '无效的API响应格式' };
        } catch (error) {
            console.error(`获取镜像列表出错: ${error.message}`);
            return { status: 'error', message: `获取镜像列表失败: ${error.message}` };
        }
    }

    async generateSignedUrl(downloadUrl) {
        if (!this.aesKey) {
            this.aesKey = await this._getAesKey();
            if (!this.aesKey) throw new Error('无法获取AES密钥');
        }

        const parsedUrl = new URL(downloadUrl);
        const fileName = decodeURIComponent(parsedUrl.pathname.split('/').pop());
        const expireTime = Math.floor(Date.now() / 1000) + 300;

        const sign = crypto.createHash('md5')
            .update(`oclpmod${fileName}${expireTime}${this.aesKey}`)
            .digest('hex');

        return `https://oclpapi.simplehac.cn/DMG/down.php?origin=${
            encodeURIComponent(fileName)}&sign=${sign}&t=${expireTime}`;
    }
}

module.exports = DmgHandler;