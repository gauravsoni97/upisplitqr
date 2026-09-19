declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = () => (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();

export function initAnalytics() {
  if (typeof window === 'undefined' || typeof window.gtag === 'function') return;

  const id = measurementId();
  if (!id || !id.startsWith('G-')) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', id, {
    anonymize_ip: true,
    send_page_view: true,
  });
}
