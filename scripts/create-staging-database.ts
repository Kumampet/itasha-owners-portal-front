/**
 * STG環境用データベース作成スクリプト
 * 
 * このスクリプトは、RDSインスタンスに接続してデータベースを作成します。
 * データベースが既に存在する場合は、エラーを表示して終了します。
 */

import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

// .env.localファイルを読み込む
dotenv.config({ path: ".env.local" });

async function createDatabase() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    // DATABASE_URLをパース
    // 形式: mysql://user:password@host:port/database
    const url = new URL(databaseUrl.replace(/^mysql:\/\//, "http://"));
    const host = url.hostname;
    const port = parseInt(url.port || "3306", 10);
    const user = url.username;
    const password = decodeURIComponent(url.password || "");
    const databaseName = url.pathname.slice(1); // 先頭の/を削除

    console.log(`接続情報:`);
    console.log(`  ホスト: ${host}`);
    console.log(`  ポート: ${port}`);
    console.log(`  ユーザー: ${user}`);
    console.log(`  データベース名: ${databaseName}`);

    // データベース名を指定せずに接続（データベースが存在しない場合でも接続可能）
    const connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
    });

    try {
        console.log("\nデータベース接続に成功しました。");

        // データベースが既に存在するか確認
        const [databases] = await connection.query<mysql.RowDataPacket[]>(
            "SHOW DATABASES LIKE ?",
            [databaseName]
        );

        if (databases.length > 0) {
            console.log(`\n⚠️  データベース "${databaseName}" は既に存在します。`);
            console.log("   Prismaのマイグレーションを実行してください:");
            console.log("   npx prisma migrate deploy");
            return;
        }

        // データベースを作成
        console.log(`\nデータベース "${databaseName}" を作成しています...`);
        await connection.query(`CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ データベース "${databaseName}" の作成が完了しました。`);

        console.log("\n次のステップ:");
        console.log("1. Prismaのマイグレーションを実行:");
        console.log("   npx prisma migrate deploy");
        console.log("\n2. または、Prismaのスキーマをプッシュ:");
        console.log("   npx prisma db push");
    } catch (error) {
        console.error("\n❌ エラーが発生しました:");
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error(error);
        }
        throw error;
    } finally {
        await connection.end();
    }
}

// スクリプトを実行
createDatabase()
    .then(() => {
        console.log("\n✅ スクリプトが正常に完了しました。");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ スクリプトの実行に失敗しました:");
        console.error(error);
        process.exit(1);
    });

