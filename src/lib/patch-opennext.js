const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../node_modules/@opennextjs/cloudflare/dist/cli/build/bundle-server.js');

try {
  if (!fs.existsSync(targetPath)) {
    console.log(`[Patch] Target file not found: ${targetPath}. Skipping patch.`);
    process.exit(0);
  }

  let content = fs.readFileSync(targetPath, 'utf8');

  // Check if patch is already applied
  if (content.includes('ignore-hashed-externals')) {
    console.log('[Patch] @opennextjs/cloudflare is already patched.');
    process.exit(0);
  }

  const searchStr = 'updater.plugin,';
  const patchStr = `
            {
                name: "ignore-hashed-externals",
                setup(build) {
                    build.onResolve({ filter: /^(sharp|@aws-sdk\\/client-s3|@prisma\\/client)-.*/ }, (args) => ({
                        path: args.path,
                        external: true,
                    }));
                }
            },`;

  const index = content.indexOf(searchStr);
  if (index === -1) {
    console.error('[Patch] Error: Could not find search string in bundle-server.js');
    process.exit(1);
  }

  // Insert patch after searchStr
  const newContent = content.slice(0, index + searchStr.length) + patchStr + content.slice(index + searchStr.length);
  fs.writeFileSync(targetPath, newContent, 'utf8');
  console.log('[Patch] Successfully patched @opennextjs/cloudflare/dist/cli/build/bundle-server.js');
} catch (e) {
  console.error('[Patch] Error patching @opennextjs/cloudflare:', e);
  process.exit(1);
}
