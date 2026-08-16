import React, { useEffect } from 'react';
import { SeoPageMetadata, ORG_SCHEMA, SOFTWARE_APP_SCHEMA, WEBSITE_SEARCH_SCHEMA } from './seoData';

interface SeoHeadProps {
  meta: SeoPageMetadata;
  customSchemas?: object[];
}

export default function SeoHead({ meta, customSchemas = [] }: SeoHeadProps) {
  useEffect(() => {
    // 1. Title
    document.title = meta.title;

    // Helper to set or create meta tag
    const setMeta = (attr: string, value: string, content: string) => {
      let element = document.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, value);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to set or create link tag
    const setLink = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang 
        ? `link[rel="${rel}"][hreflang="${hreflang}"]` 
        : `link[rel="${rel}"]:not([hreflang])`;
      let element = document.querySelector(selector) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        if (hreflang) element.setAttribute('hreflang', hreflang);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // Update HTML lang attribute
    document.documentElement.lang = meta.lang;

    // 2. Standard Meta Tags
    setMeta('name', 'description', meta.description);
    setMeta('name', 'keywords', meta.keywords.join(', '));
    setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // 3. Canonical & Hreflang Tags
    setLink('canonical', meta.canonical);
    if (meta.alternateUrl) {
      setLink('alternate', meta.alternateUrl.pt, 'pt-BR');
      setLink('alternate', meta.alternateUrl.en, 'en');
      setLink('alternate', meta.alternateUrl.en, 'x-default');
    }

    // 4. OpenGraph Tags
    setMeta('property', 'og:type', meta.ogType || 'website');
    setMeta('property', 'og:title', meta.title);
    setMeta('property', 'og:description', meta.description);
    setMeta('property', 'og:url', meta.canonical);
    setMeta('property', 'og:locale', meta.lang === 'pt-BR' ? 'pt_BR' : 'en_US');
    setMeta('property', 'og:site_name', 'Planner Amplifica');
    setMeta('property', 'og:image', 'https://planner.amplificagroup.com/icon-192.png');

    // 5. Twitter Card Tags
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', meta.title);
    setMeta('name', 'twitter:description', meta.description);
    setMeta('name', 'twitter:image', 'https://planner.amplificagroup.com/icon-192.png');

    // 6. JSON-LD Schemas injection
    const existingSchemas = document.querySelectorAll('script[data-seo-schema="true"]');
    existingSchemas.forEach((el) => el.remove());

    const schemasToInject: object[] = [
      ORG_SCHEMA,
      SOFTWARE_APP_SCHEMA(meta.lang),
      WEBSITE_SEARCH_SCHEMA
    ];

    // FAQ Schema if present
    if (meta.faqs && meta.faqs.length > 0) {
      schemasToInject.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: meta.faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer
          }
        }))
      });
    }

    // BreadcrumbList Schema if present
    if (meta.breadcrumbs && meta.breadcrumbs.length > 0) {
      schemasToInject.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: meta.breadcrumbs.map((b, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: b.name,
          item: b.item
        }))
      });
    }

    // Add custom schemas
    customSchemas.forEach((s) => schemasToInject.push(s));

    // Append script elements to head
    schemasToInject.forEach((schemaObj, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-schema', 'true');
      script.id = `seo-schema-${index}`;
      script.text = JSON.stringify(schemaObj);
      document.head.appendChild(script);
    });
  }, [meta, customSchemas]);

  return null;
}
