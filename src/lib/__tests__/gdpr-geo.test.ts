/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import {
  getRequestCountryCode,
  isEuGeoBlockDisabled,
  shouldBlockGdprRegion,
  shouldSkipGdprGeoBlock,
} from "../gdpr-geo";

function createRequest(
  url: string,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(url, { headers });
}

describe("gdpr-geo", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDisableEu = process.env.DISABLE_EU_GEOBLOCK;
  const originalGeoBlockUnknown = process.env.GEO_BLOCK_UNKNOWN_COUNTRY;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalDisableEu === undefined) {
      delete process.env.DISABLE_EU_GEOBLOCK;
    } else {
      process.env.DISABLE_EU_GEOBLOCK = originalDisableEu;
    }
    if (originalGeoBlockUnknown === undefined) {
      delete process.env.GEO_BLOCK_UNKNOWN_COUNTRY;
    } else {
      process.env.GEO_BLOCK_UNKNOWN_COUNTRY = originalGeoBlockUnknown;
    }
  });

  describe("isEuGeoBlockDisabled", () => {
    it("本番以外では地理ブロックを無効にする", () => {
      process.env.NODE_ENV = "test";
      delete process.env.DISABLE_EU_GEOBLOCK;

      expect(isEuGeoBlockDisabled()).toBe(true);
    });

    it("本番かつ DISABLE_EU_GEOBLOCK が未設定なら地理ブロックを有効にする", () => {
      process.env.NODE_ENV = "production";
      delete process.env.DISABLE_EU_GEOBLOCK;

      expect(isEuGeoBlockDisabled()).toBe(false);
    });

    it("本番でも DISABLE_EU_GEOBLOCK=true なら地理ブロックを無効にする", () => {
      process.env.NODE_ENV = "production";
      process.env.DISABLE_EU_GEOBLOCK = "true";

      expect(isEuGeoBlockDisabled()).toBe(true);
    });
  });

  describe("shouldBlockGdprRegion", () => {
    it("EEA/英国の国コードはブロックする", () => {
      expect(shouldBlockGdprRegion("DE")).toBe(true);
      expect(shouldBlockGdprRegion("GB")).toBe(true);
    });

    it("対象外の国コードはブロックしない", () => {
      expect(shouldBlockGdprRegion("JP")).toBe(false);
      expect(shouldBlockGdprRegion("US")).toBe(false);
    });

    it("国コード不明時は GEO_BLOCK_UNKNOWN_COUNTRY が true のときだけブロックする", () => {
      delete process.env.GEO_BLOCK_UNKNOWN_COUNTRY;
      expect(shouldBlockGdprRegion(undefined)).toBe(false);

      process.env.GEO_BLOCK_UNKNOWN_COUNTRY = "true";
      expect(shouldBlockGdprRegion(undefined)).toBe(true);
    });
  });

  describe("getRequestCountryCode", () => {
    it("CloudFront の国コードヘッダーを優先する", () => {
      const request = createRequest("https://example.com/", {
        "cloudfront-viewer-country": "de",
        "x-vercel-ip-country": "JP",
        "cf-ipcountry": "US",
      });

      expect(getRequestCountryCode(request)).toBe("DE");
    });

    it("CloudFront が無いときは Vercel の国コードヘッダーを使う", () => {
      const request = createRequest("https://example.com/", {
        "x-vercel-ip-country": "fr",
        "cf-ipcountry": "US",
      });

      expect(getRequestCountryCode(request)).toBe("FR");
    });

    it("CloudFront と Vercel が無いときは Cloudflare の国コードヘッダーを使う", () => {
      const request = createRequest("https://example.com/", {
        "cf-ipcountry": "gb",
      });

      expect(getRequestCountryCode(request)).toBe("GB");
    });

    it("不明扱いの国コードは undefined を返す", () => {
      for (const code of ["XX", "ZZ", "T1", ""]) {
        const request = createRequest("https://example.com/", {
          "cloudfront-viewer-country": code,
        });

        expect(getRequestCountryCode(request)).toBeUndefined();
      }
    });

    it("前後の空白を除去して大文字化する", () => {
      const request = createRequest("https://example.com/", {
        "cloudfront-viewer-country": "  jp  ",
      });

      expect(getRequestCountryCode(request)).toBe("JP");
    });
  });

  describe("shouldSkipGdprGeoBlock", () => {
    it("本番以外では常にスキップする", () => {
      process.env.NODE_ENV = "development";
      const request = createRequest("https://example.com/", {
        host: "example.com",
        "cloudfront-viewer-country": "DE",
      });

      expect(shouldSkipGdprGeoBlock(request)).toBe(true);
    });

    it("本番でも DISABLE_EU_GEOBLOCK=true ならスキップする", () => {
      process.env.NODE_ENV = "production";
      process.env.DISABLE_EU_GEOBLOCK = "true";
      const request = createRequest("https://example.com/", {
        host: "example.com",
        "cloudfront-viewer-country": "DE",
      });

      expect(shouldSkipGdprGeoBlock(request)).toBe(true);
    });

    it("本番の localhost は国コードがあってもスキップする", () => {
      process.env.NODE_ENV = "production";
      delete process.env.DISABLE_EU_GEOBLOCK;
      const request = createRequest("http://localhost:3000/", {
        host: "localhost:3000",
        "cloudfront-viewer-country": "DE",
      });

      expect(shouldSkipGdprGeoBlock(request)).toBe(true);
    });

    it("本番の 127.0.0.1 は国コードがあってもスキップする", () => {
      process.env.NODE_ENV = "production";
      delete process.env.DISABLE_EU_GEOBLOCK;
      const request = createRequest("http://127.0.0.1:3000/", {
        host: "127.0.0.1:3000",
        "cloudfront-viewer-country": "DE",
      });

      expect(shouldSkipGdprGeoBlock(request)).toBe(true);
    });

    it("本番の x-forwarded-host が localhost ならスキップする", () => {
      process.env.NODE_ENV = "production";
      delete process.env.DISABLE_EU_GEOBLOCK;
      const request = createRequest("https://example.com/", {
        host: "example.com",
        "x-forwarded-host": "localhost:3000",
        "cloudfront-viewer-country": "DE",
      });

      expect(shouldSkipGdprGeoBlock(request)).toBe(true);
    });

    it("本番のリモートホストではスキップしない", () => {
      process.env.NODE_ENV = "production";
      delete process.env.DISABLE_EU_GEOBLOCK;
      const request = createRequest("https://example.com/", {
        host: "example.com",
        "cloudfront-viewer-country": "DE",
      });

      expect(shouldSkipGdprGeoBlock(request)).toBe(false);
    });
  });
});
