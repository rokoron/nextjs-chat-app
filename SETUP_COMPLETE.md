# セットアップ完了ガイド

## 完了した作業

✅ データベース接続完了（Prisma Postgres）
✅ データベースマイグレーション実行完了
✅ 環境変数設定完了

## 設定された環境変数

- `DATABASE_URL`: Prisma Postgresの接続URL（自動設定）
- `JWT_SECRET`: JWT認証用の秘密鍵
- `NEXTAUTH_SECRET`: NextAuth用の秘密鍵
- `NEXTAUTH_URL`: アプリのURL

## 次のステップ

### 1. アプリの動作確認

デプロイされたアプリにアクセス：
https://nextjs-chat-app-liard-sigma.vercel.app

### 2. テスト手順

1. **ユーザー登録**
   - `/register`ページでアカウントを作成

2. **チャンネル作成**
   - ログイン後、サイドバーの「+」ボタンでチャンネルを作成

3. **メッセージ送信**
   - チャンネルを選択してメッセージを送信

4. **リアクション追加**
   - メッセージにリアクションを追加

### 3. トラブルシューティング

#### データベース接続エラーが発生する場合

Vercelの環境変数で`DATABASE_URL`が正しく設定されているか確認：
```bash
npx vercel env ls
```

#### 認証エラーが発生する場合

`JWT_SECRET`が設定されているか確認：
```bash
npx vercel env ls | grep JWT_SECRET
```

#### マイグレーションを再実行する場合

```bash
npx vercel env pull .env.local
export $(cat .env.local | grep DATABASE_URL | xargs)
npx prisma migrate deploy
```

## 開発環境での実行

ローカルで開発する場合：

```bash
# 環境変数を取得
npx vercel env pull .env.local

# 依存関係をインストール
npm install

# Prismaクライアントを生成
npm run db:generate

# 開発サーバーを起動
npm run dev
```

## 参考リンク

- GitHubリポジトリ: https://github.com/rokoron/nextjs-chat-app
- VercelデプロイURL: https://nextjs-chat-app-liard-sigma.vercel.app
- Vercelダッシュボード: https://vercel.com/dashboard
