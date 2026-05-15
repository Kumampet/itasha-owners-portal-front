import Script from "next/script";

import {
  getGoogleMeasurementId,
  isGoogleAnalyticsEnabled,
} from "@/lib/robots-metadata";

/**
 * GA4（gtag.js）。測定IDがなければ何も読み込みません。
 */
export function GoogleAnalytics() {
  if (!isGoogleAnalyticsEnabled()) {
    return null;
  }
  const id = getGoogleMeasurementId();
  if (!id) {
    return null;
  }

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-gtag-init" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');
`}
      </Script>
    </>
  );
}
