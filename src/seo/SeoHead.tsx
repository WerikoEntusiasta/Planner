import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SeoPageMetadata, ORG_SCHEMA, SOFTWARE_APP_SCHEMA, WEBSITE_SEARCH_SCHEMA } from './seoData';

interface SeoHeadProps {
  meta: SeoPageMetadata;
  customSchemas?: object[];
}

export default function SeoHead({ meta, customSchemas = [] }: SeoHeadProps) {
  const schemasToInject: object[] = [
    ORG_SCHEMA,
    SOFTWARE_APP_SCHEMA(meta.lang),
    WEBSITE_SEARCH_SCHEMA
  ];

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

  customSchemas.forEach((s) => schemasToInject.push(s));

  return (
    <Helmet>
      <title>{meta.title}</title>
      <html lang={meta.lang} />
      <meta name="description" content={meta.description} />
      <meta name="keywords" content={meta.keywords.join(', ')} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <link rel="canonical" href={meta.canonical} />
      {meta.alternateUrl && (
        <>
          <link rel="alternate" href={meta.alternateUrl.pt} hrefLang="pt-BR" />
          <link rel="alternate" href={meta.alternateUrl.en} hrefLang="en" />
          <link rel="alternate" href={meta.alternateUrl.en} hrefLang="x-default" />
        </>
      )}
      <meta property="og:type" content={meta.ogType || 'website'} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={meta.canonical} />
      <meta property="og:locale" content={meta.lang === 'pt-BR' ? 'pt_BR' : 'en_US'} />
      <meta property="og:site_name" content="Planner Amplifica" />
      <meta property="og:image" content="https://planner.amplificagroup.com/icon-192.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content="https://planner.amplificagroup.com/icon-192.png" />
      {schemasToInject.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
