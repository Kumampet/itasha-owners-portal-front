# GDPR 地理ブロック

## 実装

- `src/middleware.ts` + `src/lib/gdpr-geo.ts`

## 挙動

- 対象国コードからのアクセスは HTTP 451（日英メッセージ）
- CloudFront / Vercel 等の国ヘッダーを参照
- `DISABLE_EU_GEOBLOCK`, `GEO_BLOCK_UNKNOWN_COUNTRY` で調整

## 破壊禁止

- API を matcher 外にして地域制限をすり抜けさせる
- 451 以外のステータスに勝手に変更してクライアントが誤解する
