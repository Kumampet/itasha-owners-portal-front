const fs = require('fs');

const path = 'wrangler.jsonc';
if (!fs.existsSync(path)) {
  console.log('wrangler.jsonc not found, skipping alias removal.');
  process.exit(0);
}

const config = JSON.parse(fs.readFileSync(path, 'utf8'));

if (config.alias && config.alias['@aws-sdk/client-s3']) {
  delete config.alias['@aws-sdk/client-s3'];
  console.log('Removed @aws-sdk/client-s3 from wrangler.jsonc alias');
}
if (config.alias) {
  // 派生したエイリアスも削除 (e.g. @aws-sdk/client-s3-abcdefg)
  for (const key of Object.keys(config.alias)) {
    if (key.startsWith('@aws-sdk/client-s3-')) {
      delete config.alias[key];
      console.log(`Removed ${key} from wrangler.jsonc alias`);
    }
  }
}

fs.writeFileSync(path, JSON.stringify(config, null, '\t'));
