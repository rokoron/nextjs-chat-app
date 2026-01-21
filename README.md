# Chat App - Slack簡易版チャットアプリ

Next.js 14を使用したフルスタックリアルタイムチャットアプリケーションです。

## 機能

- ユーザー認証（登録・ログイン）
- チャンネル機能（公開・プライベート）
- リアルタイムメッセージング（Server-Sent Events）
- メッセージへのリアクション機能

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: PostgreSQL + Prisma
- **認証**: JWT
- **リアルタイム通信**: Server-Sent Events (SSE)

## セットアップ

### 前提条件

- Node.js 18以上
- PostgreSQL 14以上
- npm または yarn

### インストール

```bash
npm install
```

### 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/chat_app?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"
```

### データベースのセットアップ

```bash
# Prismaクライアントを生成
npm run db:generate

# マイグレーションを実行
npm run db:migrate
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## Vercelへのデプロイ

### 1. Vercel Postgresデータベースの作成

1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. 「Storage」タブを開く
3. 「Create Database」→「Postgres」を選択
4. データベースを作成

### 2. 環境変数の設定

Vercelのプロジェクト設定で以下の環境変数を設定：

- `DATABASE_URL`: Vercel Postgresの接続URL（自動設定される）
- `JWT_SECRET`: ランダムな文字列（例: `openssl rand -base64 32`）
- `NEXTAUTH_URL`: デプロイ後のアプリURL
- `NEXTAUTH_SECRET`: ランダムな文字列

### 3. GitHubリポジトリにプッシュ

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 4. Vercelでプロジェクトをインポート

1. [Vercel](https://vercel.com)にログイン
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリをインポート
4. 環境変数を設定
5. 「Deploy」をクリック

### 5. データベースマイグレーション

Vercelのデプロイ後、以下のコマンドでマイグレーションを実行：

```bash
# Vercel CLIを使用
vercel env pull .env.local
npx prisma migrate deploy
```

または、Vercelのダッシュボードから「Run Command」で実行：

```bash
npx prisma migrate deploy
```

## プロジェクト構成

```
chat-app/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証関連ページ
│   ├── chat/              # チャットページ
│   ├── api/               # API Routes
│   └── layout.tsx
├── components/            # Reactコンポーネント
├── lib/                   # ユーティリティ
├── prisma/               # Prismaスキーマ
└── public/               # 静的ファイル
```

## ライセンス

MIT
