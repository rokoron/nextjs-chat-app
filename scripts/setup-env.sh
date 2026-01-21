#!/bin/bash

# JWT_SECRETを生成
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

echo "以下の環境変数をVercelのプロジェクト設定に追加してください："
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo "NEXTAUTH_URL=https://nextjs-chat-app-liard-sigma.vercel.app"
echo ""
echo "Vercel CLIを使用する場合："
echo "npx vercel env add JWT_SECRET"
echo "npx vercel env add NEXTAUTH_SECRET"
echo "npx vercel env add NEXTAUTH_URL"
