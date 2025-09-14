const express = require('express');
const path = require('path');
const WebCrawler = require('./crawler');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// クローラーインスタンス
let crawler = null;

// ルート - メインページ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// クロール開始API
app.post('/api/crawl', async (req, res) => {
  const { url, maxPages } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URLが指定されていません' });
  }

  // URLの形式チェック
  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({ error: '無効なURL形式です' });
  }

  // 既存のクローラーが動作中の場合は停止
  if (crawler && crawler.isRunning) {
    crawler.stop();
  }

  try {
    crawler = new WebCrawler();
    const maxPagesLimit = Math.min(parseInt(maxPages) || 50, 2000); // 最大2000ページに制限
    
    res.json({ 
      message: 'クロールを開始しました',
      url: url,
      maxPages: maxPagesLimit
    });

    // バックグラウンドでクロール実行
    crawler.crawl(url, maxPagesLimit).catch(error => {
      console.error('クロールエラー:', error);
    });

  } catch (error) {
    console.error('クロール開始エラー:', error);
    res.status(500).json({ error: 'クロールの開始に失敗しました' });
  }
});

// クロール状況確認API
app.get('/api/status', (req, res) => {
  if (!crawler) {
    return res.json({ 
      isRunning: false, 
      progress: 0, 
      totalPages: 0,
      message: 'クロールが開始されていません'
    });
  }

  const results = crawler.getResults();
  res.json({
    isRunning: crawler.isRunning,
    progress: results.length,
    totalPages: results.length,
    message: crawler.isRunning ? 'クロール実行中...' : 'クロール完了'
  });
});

// クロール結果取得API
app.get('/api/results', (req, res) => {
  if (!crawler) {
    return res.json({ pages: [] });
  }

  const results = crawler.getResults();
  res.json({ 
    pages: results,
    totalCount: results.length,
    isRunning: crawler.isRunning
  });
});

// クロール停止API
app.post('/api/stop', (req, res) => {
  if (crawler && crawler.isRunning) {
    crawler.stop();
    res.json({ message: 'クロールを停止しました' });
  } else {
    res.json({ message: 'クロールは実行されていません' });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});

// エラーハンドリング
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});