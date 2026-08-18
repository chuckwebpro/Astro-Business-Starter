/**
 * One conversion helper that fans out to whichever platforms are configured.
 * With no analytics IDs set every call is a no-op, so pages never need
 * conditional wiring — and the numbers reconcile because there is exactly one
 * place that decides what a "lead" is.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    /** Set by Meta's own bootstrap snippet. */
    _fbq?: unknown;
    uetq?: unknown[];
    dataLayer?: unknown[];
    __tagsLoaded?: boolean;
  }
}

export type ConversionType = 'lead' | 'phone' | 'directions';

interface ConversionDetail {
  /** Where on the page it happened, e.g. 'contact-form', 'header'. */
  source?: string;
  value?: number;
}

const EVENT_NAMES: Record<ConversionType, { ga4: string; meta: string; bing: string }> = {
  lead: { ga4: 'generate_lead', meta: 'Lead', bing: 'submit_lead_form' },
  phone: { ga4: 'contact_phone', meta: 'Contact', bing: 'phone_click' },
  directions: { ga4: 'get_directions', meta: 'FindLocation', bing: 'directions_click' },
};

export function trackConversion(type: ConversionType, detail: ConversionDetail = {}): void {
  if (typeof window === 'undefined') return;

  const names = EVENT_NAMES[type];

  window.gtag?.('event', names.ga4, { source: detail.source, value: detail.value });
  window.fbq?.('track', names.meta, { source: detail.source, value: detail.value });

  if (Array.isArray(window.uetq)) {
    window.uetq.push('event', names.bing, {
      event_category: detail.source,
      event_value: detail.value,
    });
  }
}

/** Wires phone and directions links site-wide without per-page markup. */
export function bindOutboundConversions(): void {
  document.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement | null)?.closest('a');
    if (!link) return;

    if (link.href.startsWith('tel:')) {
      trackConversion('phone', { source: link.dataset.source ?? 'link' });
    } else if (link.href.includes('google.com/maps')) {
      trackConversion('directions', { source: link.dataset.source ?? 'link' });
    }
  });
}
