# ページリストアプリ - Webクローラー

[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-blue.svg)](https://expressjs.com/)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-21+-orange.svg)](https://pptr.dev/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

Node.jsで作成されたWebクローラーアプリケーションです。指定したURLから同一ドメイン内の全ページをクロールし、各ページのURL、タイトル、ディスクリプションを取得してHTMLテーブル形式で表示します。

## スクリーンショット

![Web Crawler Interface](https://via.placeholder.com/800x600/f8f9fa/343a40?text=Web+Crawler+Interface)
*注：実際のスクリーンショットは後で追加してください*

## 特徴

- 🔍 **自動クロール**: 指定したURLから同一ドメイン内の全ページを自動的に発見・クロール
- 📝 **情報抽出**: 各ページからタイトル、ディスクリプション、URLを抽出
- 🚫 **リソース除外**: 画像、CSS、JavaScriptファイルは自動的にスキップ
- 📊 **リアルタイム表示**: クロール進行状況とリアルタイムでの結果表示
- 📤 **CSVエクスポート**: 結果をCSVファイルとしてダウンロード可能
- 🎨 **レスポンシブデザイン**: モバイルデバイスにも対応した使いやすいUI

## 必要環境

- Node.js 14.x 以上
- npm または yarn

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/yukiuota/page-list-app.git

# プロジェクトディレクトリに移動
cd page-list-app

# 依存パッケージをインストール
npm install
```

## 使用方法

1. **サーバーを起動:**
```bash
npm start
```

2. **ブラウザでアクセス:**
```
http://localhost:3000
```

3. **Webアプリケーションの使用方法:**
   - 「クロール開始URL」にクロールしたいサイトのURLを入力
   - 「最大ページ数」でクロールするページ数の上限を設定（最大2000ページ）
   - 「クロール開始」ボタンをクリックしてクロールを開始
   - 進行状況がリアルタイムで表示され、完了後に結果がテーブル形式で表示されます
   - 「CSVエクスポート」ボタンで結果をCSVファイルとしてダウンロード可能

## API エンドポイント

### POST /api/crawl
クロールを開始します。

**リクエストボディ:**
```json
{
  "url": "https://example.com",
  "maxPages": 50
}
```

### GET /api/status
現在のクロール状況を取得します。

### GET /api/results
クロール結果を取得します。

### POST /api/stop
実行中のクロールを停止します。

## 技術スタック

- **バックエンド**: Node.js, Express.js
- **Webクローラー**: Puppeteer, Cheerio
- **フロントエンド**: HTML5, CSS3, JavaScript (Vanilla)
- **スタイリング**: CSS Grid/Flexbox, レスポンシブデザイン

## プロジェクト構造

```
page_list_app/
├── package.json          # プロジェクト設定とパッケージ依存関係
├── server.js            # Express.jsサーバーとAPI
├── crawler.js           # Webクローラーのコア機能
├── public/              # 静的ファイル
│   └── index.html      # フロントエンドのHTML/CSS/JavaScript
└── README.md           # このファイル
```

## 主な機能

### Webクローラー (`crawler.js`)
- Puppeteerを使用したヘッドレスブラウザでのページアクセス
- 同一ドメイン内のリンク発見と自動クロール
- メタタグからのタイトル・ディスクリプション抽出
- 画像・CSS・JavaScriptの自動除外
- リクエスト制限とエラーハンドリング

### Webサーバー (`server.js`)
- RESTful APIの提供
- リアルタイムクロール状況の監視
- バックグラウンドでのクロール実行
- エラーハンドリングと安全な停止機能

### フロントエンド (`public/index.html`)
- モダンなレスポンシブデザイン
- リアルタイム進行状況表示
- ソート可能なデータテーブル
- CSVエクスポート機能

## 注意事項

- クロール対象は同一ドメイン内のページのみに制限されています
- 最大クロールページ数は2000ページに制限されています
- サーバーに負荷をかけないよう、リクエスト間に適切な間隔を設けています
- robots.txtの確認やサイトの利用規約の遵守を推奨します

## 開発モード

開発時にファイル変更の自動再起動を有効にするには:

```bash
npm run dev
```

## トラブルシューティング

### Puppeteerのインストールエラー
システムによってはPuppeteerのインストールで問題が発生する場合があります。その場合は以下を試してください:

```bash
# macOS
npm install puppeteer --unsafe-perm=true

# Linux
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

### ポート3000が使用中の場合
環境変数PORTを設定して別のポートを使用できます:

```bash
PORT=8080 npm start
```

## 貢献

プルリクエストやissueは歓迎します。大きな変更を行う場合は、まずissueを作成してディスカッションしてください。

## ライセンス

ISC License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 作者

- [@yukiuota](https://github.com/yukiuota)