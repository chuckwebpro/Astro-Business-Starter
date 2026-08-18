/**
 * Per-project configuration. This and `navigation.ts` are the two files that
 * must be filled in for every new site. Blank optional values ship nothing —
 * an empty analytics ID means that vendor's script is never emitted.
 */

export type SchemaBusinessType =
  | 'LocalBusiness'
  | 'ProfessionalService'
  | 'HomeAndConstructionBusiness'
  | 'Plumber'
  | 'Electrician'
  | 'RoofingContractor'
  | 'GeneralContractor'
  | 'Dentist'
  | 'Physician'
  | 'Attorney'
  | 'AccountingService'
  | 'InsuranceAgency'
  | 'RealEstateAgent';

export interface SiteConfig {
  /** Absolute origin, no trailing slash. Must match `site` in astro.config.mjs. */
  url: string;
  name: string;
  legalName?: string;
  tagline: string;
  description: string;
  locale: string;

  business: {
    schemaType: SchemaBusinessType;
    phone: string;
    /** Digits only, E.164 — used for tel: links. */
    phoneHref: string;
    email: string;
    address: {
      street: string;
      locality: string;
      region: string;
      postalCode: string;
      country: string;
    };
    /** Omit entirely for service-area businesses with no walk-in location. */
    geo?: { latitude: number; longitude: number };
    /** schema.org openingHours strings, e.g. 'Mo-Fr 08:00-17:00'. */
    hours: string[];
    priceRange?: string;
  };

  social: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    x?: string;
    youtube?: string;
    tiktok?: string;
  };

  /** Absolute or site-relative path to the fallback Open Graph image. */
  defaultOgImage: string;

  /** Formspree form ID only, not the full URL. Blank disables the form. */
  formspreeId: string;

  analytics: {
    ga4: string;
    gtm: string;
    metaPixel: string;
    bingUet: string;
    clarity: string;
  };

  verification: {
    google: string;
    bing: string;
    meta: string;
  };

  /** 'none' is correct for US-only clients. Switch to 'banner' only when required. */
  consent: 'none' | 'banner';
}

export const site: SiteConfig = {
  url: 'https://example.com',
  name: 'Demo Business',
  legalName: 'Demo Business LLC',
  tagline: 'Straightforward work, done right the first time.',
  description:
    'Demo Business is a placeholder used by the starter template. Replace this copy during project setup.',
  locale: 'en-US',

  business: {
    schemaType: 'LocalBusiness',
    phone: '(555) 010-4477',
    phoneHref: '+15550104477',
    email: 'hello@example.com',
    address: {
      street: '1200 Market Street, Suite 400',
      locality: 'Columbus',
      region: 'OH',
      postalCode: '43215',
      country: 'US',
    },
    geo: { latitude: 39.9612, longitude: -82.9988 },
    hours: ['Mo-Fr 08:00-17:00', 'Sa 09:00-13:00'],
    priceRange: '$$',
  },

  social: {
    facebook: 'https://facebook.com/example',
    instagram: 'https://instagram.com/example',
    linkedin: 'https://linkedin.com/company/example',
  },

  defaultOgImage: '/og-default.png',

  formspreeId: '',

  analytics: {
    ga4: '',
    gtm: '',
    metaPixel: '',
    bingUet: '',
    clarity: '',
  },

  verification: {
    google: '',
    bing: '',
    meta: '',
  },

  consent: 'none',
};

export const formattedAddress = [
  site.business.address.street,
  `${site.business.address.locality}, ${site.business.address.region} ${site.business.address.postalCode}`,
].join(', ');

/** No configured ID means the analytics bundle is never mounted at all. */
export const hasAnalytics = Object.values(site.analytics).some(Boolean);
