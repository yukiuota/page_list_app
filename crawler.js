const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const { URL } = require('url');

class WebCrawler {
  constructor() {
    this.visitedUrls = new Set();
    this.pages = [];
    this.browser = null;
    this.isRunning = false;
  }

  // ページがクロール対象かどうかチェック
  isValidPage(url, baseUrl) {
    try {
      const urlObj = new URL(url);
      const baseUrlObj = new URL(baseUrl);
      
      // 同じドメインのみクロール
      if (urlObj.hostname !== baseUrlObj.hostname) {
        return false;
      }

      // 画像、CSS、JavaScriptファイルを除外
      const excludeExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.css', '.js', '.pdf', '.doc', '.docx', '.zip'];
      const pathname = urlObj.pathname.toLowerCase();
      
      for (const ext of excludeExtensions) {
        if (pathname.endsWith(ext)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // URLを正規化
  normalizeUrl(url, baseUrl) {
    try {
      const fullUrl = new URL(url, baseUrl);
      // フラグメント（#）を削除
      fullUrl.hash = '';
      return fullUrl.href;
    } catch (error) {
      return null;
    }
  }

  // ページからリンクを抽出
  extractLinks(html, currentUrl) {
    const $ = cheerio.load(html);
    const links = new Set();

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const normalizedUrl = this.normalizeUrl(href, currentUrl);
        if (normalizedUrl && this.isValidPage(normalizedUrl, currentUrl)) {
          links.add(normalizedUrl);
        }
      }
    });

    return Array.from(links);
  }

  // ページ情報を抽出
  extractPageInfo(html, url) {
    const $ = cheerio.load(html);
    
    // タイトル取得
    let title = $('title').text().trim();
    if (!title) {
      title = $('h1').first().text().trim() || 'タイトルなし';
    }

    // ディスクリプション取得
    let description = $('meta[name="description"]').attr('content');
    if (!description) {
      description = $('meta[property="og:description"]').attr('content');
    }
    if (!description) {
      // 最初のp要素からテキストを取得
      description = $('p').first().text().trim();
    }
    if (!description) {
      description = 'ディスクリプションなし';
    }

    // 長すぎる場合は切り詰め
    if (description.length > 200) {
      description = description.substring(0, 200) + '...';
    }

    return {
      url,
      title: title || 'タイトルなし',
      description: description || 'ディスクリプションなし'
    };
  }

  // 単一ページをクロール（Puppeteer使用）
  async crawlPage(url) {
    if (this.visitedUrls.has(url) || !this.isRunning) {
      return [];
    }

    this.visitedUrls.add(url);
    console.log(`クロール中: ${url}`);

    try {
      const page = await this.browser.newPage();
      
      // ページ設定
      await page.setViewport({ width: 1280, height: 720 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // リクエストをフィルタリング（画像、CSS、JSをブロック）
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font', 'script'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      const html = await page.content();
      await page.close();

      // ページ情報を抽出
      const pageInfo = this.extractPageInfo(html, url);
      this.pages.push(pageInfo);

      // 新しいリンクを抽出
      const links = this.extractLinks(html, url);
      return links.filter(link => !this.visitedUrls.has(link));

    } catch (error) {
      console.error(`エラー: ${url} - ${error.message}`);
      return [];
    }
  }

  // 単一ページをクロール（axios使用・フォールバック）
  async crawlPageWithAxios(url) {
    if (this.visitedUrls.has(url) || !this.isRunning) {
      return [];
    }

    this.visitedUrls.add(url);
    console.log(`クロール中（axios）: ${url}`);

    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        maxRedirects: 5
      });

      const html = response.data;

      // ページ情報を抽出
      const pageInfo = this.extractPageInfo(html, url);
      this.pages.push(pageInfo);

      // 新しいリンクを抽出
      const links = this.extractLinks(html, url);
      return links.filter(link => !this.visitedUrls.has(link));

    } catch (error) {
      console.error(`エラー（axios）: ${url} - ${error.message}`);
      return [];
    }
  }

  // クロール開始
  async crawl(startUrl, maxPages = 50) {
    this.visitedUrls.clear();
    this.pages = [];
    this.isRunning = true;

    try {
      // macOS用の設定
      let launchOptions = {
        headless: 'new',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-blink-features=AutomationControlled'
        ],
        ignoreDefaultArgs: ['--enable-automation'],
        ignoreHTTPSErrors: true
      };

      // macOSでシステムのChromeを試す
      if (process.platform === 'darwin') {
        const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        if (fs.existsSync(chromePath)) {
          launchOptions.executablePath = chromePath;
        }
      }

      let usePuppeteer = true;
      try {
        this.browser = await puppeteer.launch(launchOptions);
        console.log('Puppeteerでブラウザを起動しました');
      } catch (puppeteerError) {
        console.log('Puppeteerの起動に失敗しました。axiosモードを使用します:', puppeteerError.message);
        usePuppeteer = false;
      }

      const urlQueue = [startUrl];
      let processedCount = 0;

      while (urlQueue.length > 0 && processedCount < maxPages && this.isRunning) {
        const currentUrl = urlQueue.shift();
        
        // PuppeteerまたはaxiosでクロールEXECUTE
        const newLinks = usePuppeteer 
          ? await this.crawlPage(currentUrl)
          : await this.crawlPageWithAxios(currentUrl);
        
        // 新しいリンクをキューに追加
        for (const link of newLinks) {
          if (!urlQueue.includes(link) && urlQueue.length < 100) {
            urlQueue.push(link);
          }
        }

        processedCount++;
        
        // 少し待機（サーバーに負荷をかけないため）
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`クロール完了: ${this.pages.length} ページ処理済み`);
      return this.pages;

    } catch (error) {
      console.error('クロールエラー:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
      this.isRunning = false;
    }
  }

  // クロール停止
  stop() {
    this.isRunning = false;
  }

  // 結果を取得
  getResults() {
    return this.pages;
  }
}

module.exports = WebCrawler;