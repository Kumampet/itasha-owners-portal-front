import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
    build: {
      esbuild: {
        external: ["sharp", "@panva/hkdf"],
        plugins: [
          {
            name: "ignore-next-hashed-externals",
            setup(build) {
              build.onResolve({ filter: /^(sharp|@aws-sdk\/client-s3|@prisma\/client)-.*/ }, (args) => ({
                path: args.path,
                external: true,
              }));
            },
          },
        ],
      },
    },
  },
  edgeExternals: ["sharp", "@panva/hkdf"],
});