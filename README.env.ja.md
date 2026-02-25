# 環境変数セットアップガイド

このガイドでは、ローカル開発およびデプロイメントのための環境変数の設定方法を説明します。

## 📋 クイックスタート (ローカル開発)

1. **サンプルファイルをコピーする:**
   ```bash
   cp .env.example .env
   ```

2. **`.env` を編集して実際の値を追加する:**
   ```bash
   SPRING_AI_GOOGLE_GENAI_API_KEY=your-actual-api-key
   SPRING_AI_GOOGLE_GENAI_PROJECT_ID=not-used-api-key-mode
   ```

3. **Google GenAI APIキーを取得する:**
   - アクセス: https://aistudio.google.com/app/apikey
   - 新しいAPIキーを作成する
   - それをコピーして `.env` ファイルに貼り付ける

## 🗂️ 環境変数ファイルの概要

| ファイル | 目的 | Gitにコミットされるか？ |
|------|---------|-------------------|
| `.env.example` | チームメンバー向けのテンプレート | ✅ はい |
| `.env` | ローカル開発用シークレット | ❌ いいえ (.gitignoreで除外) |
| `front/.env.example` | フロントエンド用テンプレート | ✅ はい |
| `front/.env.development` | フロントエンド開発用設定 | ❌ いいえ (.gitignoreで除外) |
| `front/.env.production` | フロントエンド本番用設定 | ❌ いいえ (.gitignoreで除外) |

## 🔐 セキュリティベストプラクティス

### ✅ やるべきこと:
- `.env.example` を使って必要な変数を文書化する
- 実際のAPIキーは `.env` に保持する（コミットしない）
- 本番環境のシークレットにはRailwayのダッシュボードを使用する
- 機密ではないデフォルト値は `.env.example` で共有する

### ❌ やってはいけないこと:
- 実際のAPIキーが含まれた `.env` ファイルをコミットする
- チャットやメールでAPIキーを共有する
- ソースコード内にシークレットをハードコードする

## 🚀 デプロイメント (Railway)

Railwayでの本番デプロイメント用:

1. **Railwayダッシュボードに移動** → Your Project → Service
2. **"Variables" タブをクリック**
3. **以下の変数を追加する:**
   ```
   SPRING_AI_GOOGLE_GENAI_API_KEY=<your-production-api-key>
   SPRING_AI_GOOGLE_GENAI_PROJECT_ID=not-used-api-key-mode
   ```

## 📝 必要な環境変数

### リソースサーバー (バックエンド)

| 変数 | 説明 | 例 |
|----------|-------------|---------|
| `SPRING_AI_GOOGLE_GENAI_API_KEY` | Google GenAI APIキー | `AIzaSy...` |
| `SPRING_AI_GOOGLE_GENAI_PROJECT_ID` | GCP プロジェクトID (APIキーモード用ダミー) | `not-used-api-key-mode` |

### Auth0 (認証)

| 変数 | 説明 | 例 |
|----------|-------------|---------|
| `OAUTH2_CLIENT_ID` | Auth0 クライアントID | `Noff...` |
| `OAUTH2_CLIENT_SECRET` | Auth0 クライアントシークレット | `C_XP...` |
| `OAUTH2_ISSUER_URI` | Auth0 発行者URI | `https://...` |
| `OAUTH2_AUDIENCE` | Auth0 対象 (API識別子) | `todo-app-api` |

### サーバーURL

| 変数 | 説明 | 例 |
|----------|-------------|---------|
| `APP_FRONT_URL` | フロントエンドURL (ブラウザアクセス) | `http://localhost:5173` |
| `APP_API_URL` | バックエンドAPI URL (パブリック) | `https://localhost` |

### フロントエンド

フロントエンドの環境変数は `front/.env.development` と `front/.env.production` にあります:

| 変数 | 説明 | 例 |
|----------|-------------|---------|
| `VITE_BFF_API_BASE_URL` | BFFサーバーURL | `https://localhost/bff` |

## 🆘 トラブルシューティング

### "Google GenAI project-id must be set!" エラー
- プロジェクトのルートディレクトリに `.env` ファイルが存在するか確認する
- `SPRING_AI_GOOGLE_GENAI_PROJECT_ID` が設定されているか確認する
- Dockerコンテナを再起動する: `docker compose down && docker compose up -d`

### APIキーが機能しない
- https://aistudio.google.com/app/apikey でAPIキーが有効か確認する
- `.env` ファイルに余分なスペースがないか確認する
- キーが `AIzaSy` で始まっているか確認する

## 🔄 環境変数の更新

`.env` を変更した後:

```bash
# Dockerコンテナを再起動する
docker compose down
docker compose up -d --build
```

## 👥 チームオンボーディング

新しいチームメンバーが参加した時:

1. リポジトリをクローンする
2. **バックエンドのセットアップ:**
   ```bash
   cp .env.example .env
   # .env を編集してAPIキーを追加する
   ```
3. **フロントエンドのセットアップ:**
   ```bash
   cp front/.env.example front/.env.development
   # ローカル開発ではデフォルト値で動作するはずです
   ```
4. チームリードにAPIキーを要求する (安全なチャンネル経由で)
5. 実際の値で `.env` を更新する
6. 実行: `docker compose up -d`

---

**注意:** 実際のシークレットを含む `.env` ファイルは絶対にコミットしないでください。常にテンプレートとして `.env.example` を使用してください。
