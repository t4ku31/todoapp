# Todo App

AIを活用したタスク管理機能を備えたフルスタックTodoアプリケーションです。

## 🚀 クイックスタート

### 前提条件
- Docker & Docker Compose
- Node.js 20以上 (フロントエンドのローカル開発用)
- Google GenAI API キー ([こちらから取得](https://aistudio.google.com/app/apikey))

### セットアップ

1. **リポジトリのクローン**
   ```bash
   git clone <repository-url>
   cd todo-app
   ```

2. **環境変数の設定**
   ```bash
   cp .env.example .env
   # .envを編集し、Google GenAI APIキーを追加してください
   ```
   
   📖 **詳細な手順については[環境変数ガイド](./README.env.ja.md)を参照してください**

3. **アプリケーションの起動**
   ```bash
   docker compose up -d
   ```

4. **アプリケーションへのアクセス**
   - フロントエンド: https://localhost
   - BFF: https://localhost/bff
   - リソースサーバー: http://localhost:8080

## 📁 プロジェクト構成

```
todo-app/
├── front/                 # Reactフロントエンド (Vite + TypeScript)
├── backend/
│   ├── bff/              # Backend for Frontend (Spring Boot)
│   └── resource/         # リソースサーバー (Spring Boot + Spring AI)
├── docker/               # Docker設定
├── .env.example          # 環境変数のテンプレート
└── README.env.ja.md      # 環境構築ガイド
```

## 🛠️ 技術スタック

### フロントエンド
- React 19 + TypeScript
- Vite 7
- TailwindCSS 4
- React Router 7
- TanStack React Query (サーバー状態管理)
- Zustand (クライアント状態管理)

### バックエンド
- Spring Boot 3.5.5
- Spring Security (OAuth2)
- Spring AI 1.1.2 (Google GenAI)
- MySQL 8.0
- Flyway (データベースマイグレーション)

### インフラストラクチャ
- Docker & Docker Compose
- Nginx (リバースプロキシ)
- Railway (デプロイ環境)

## 🤖 AI機能

このアプリはAIベースのタスク管理にGoogleのGemini APIを使用しています：
- 自然言語によるタスク作成
- インテリジェントなタスクの提案
- チャットを通じた一括操作
- コンテキストに応じたタスクの更新

## 📚 ドキュメント

- [環境変数のセットアップ](./README.env.ja.md) - 環境変数の設定方法
- [フロントエンド README](./front/README.md) - フロントエンド固有のドキュメント
- [API ドキュメント](http://localhost:8080/swagger-ui.html) - OpenAPI ドキュメント (起動時のみ)

## 🔧 開発

### 個別サービスの起動

**フロントエンドのみ:**
```bash
cd front
npm install
npm run dev
```

**バックエンドのみ:**
```bash
cd backend/resource
./mvnw spring-boot:run
```

### データベースマイグレーション

マイグレーションは起動時にFlywayによって自動的に適用されます。

マイグレーションファイル: `backend/resource/src/main/resources/db/migration/`

## 🚢 デプロイ

このプロジェクトはRailwayにデプロイされています。デプロイ設定については[環境変数ガイド](./README.env.ja.md)を参照してください。

## 👥 チーム開発

プロジェクトに参加するチームメンバー向け：

1. [クイックスタート](#-クイックスタート) ガイドに従ってください
2. [環境変数ガイド](./README.env.ja.md) をお読みください
3. APIキーについてはチームリードに尋ねてください (絶対にコミットしないでください！)
