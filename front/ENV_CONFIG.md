# Environment Configuration Guide

このプロジェクトでは、環境変数とaxiosを使用してBFFサーバーとの通信を管理しています。

## 環境変数ファイル

- `.env.development` - 開発環境用の設定
- `.env.local` - ローカル環境用のオーバーライド（gitignoreされます）


## 利用可能な環境変数

### `VITE_BFF_API_BASE_URL`
BFF APIのベースURL

- **デフォルト値**: `https://localhost/bff`
- **例**: `https://localhost/bff`, `https://api.example.com`

## 使用方法

### 1. 環境変数の設定

環境変数ファイル（`.env.development`）を編集して値を設定します。

```env
VITE_BFF_API_BASE_URL=https://localhost/bff
```


### 2. コード内での使用（推奨: axios）

`src/config/env.ts` から `apiClient` をインポートして使用します。

```typescript
import { apiClient } from '@/config/env';

// GETリクエスト
const response = await apiClient.get<TaskList[]>('/api/tasklists');
console.log(response.data);

// POSTリクエスト
const response = await apiClient.post('/api/tasks', {
  title: 'New Task',
  detail: 'Task details'
});

// PUTリクエスト
const response = await apiClient.put(`/api/tasks/${taskId}`, {
  title: 'Updated Task'
});

// DELETEリクエスト
const response = await apiClient.delete(`/api/tasks/${taskId}`);
```

### 3. 直接環境変数にアクセス

```typescript
import { env } from '@/config/env';

console.log(env.bffApiBaseUrl); // => 'https://localhost/bff'
```

## axiosの利点

1. **自動JSONパース**: レスポンスが自動的にJSONとしてパースされます
2. **型安全性**: TypeScriptのジェネリクスで型を指定できます
3. **エラーハンドリング**: インターセプターで統一的なエラー処理が可能
4. **認証**: `withCredentials: true` で自動的にCookieを含めます
5. **簡潔な構文**: fetchよりもシンプルで読みやすいコード

## 注意事項

1. **Viteプレフィックス**: Viteで環境変数を使用する場合、変数名は `VITE_` で始まる必要があります
2. **ビルド時の埋め込み**: 環境変数はビルド時に静的に埋め込まれます
3. **再起動が必要**: 環境変数を変更した場合、開発サーバーの再起動が必要です
4. **セキュリティ**: 秘密情報を環境変数に含めないでください（クライアントサイドで公開されます）

## 環境別の設定

### 開発環境
```bash
npm run dev
```
→ `.env.development` が読み込まれます


## エラーハンドリング

`apiClient` には自動的にエラーハンドリングのインターセプターが設定されています：

- **サーバーエラー**: HTTPステータスコードとレスポンスデータをコンソールに出力
- **ネットワークエラー**: リクエストが送信されたがレスポンスがない場合
- **その他のエラー**: その他の予期しないエラー

カスタムエラーハンドリングが必要な場合は、try-catchブロックで処理してください。
