export function JsonLd() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stockos-pro.vercel.app';

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'StockOS Pro',
    url: appUrl,
    description:
      'ERP/SaaS de gestion commerciale, facturation et stock pour PME en Afrique de l\'Ouest.',
    founder: { '@type': 'Person', name: 'StockOS Pro' },
    sameAs: [appUrl],
  };

  const software = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'StockOS Pro',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Android, iOS',
    offers: {
      '@type': 'Offer',
      price: '90000',
      priceCurrency: 'XOF',
      description: 'Abonnement annuel — 90 000 FCFA',
    },
    browserRequirements: 'Requires a modern web browser',
    featureList: [
      'Facturation professionnelle',
      'Gestion de stock en temps réel',
      'Caisse enregistreuse intégrée',
      'Rapports et analyses',
      'Multi-devises (FCFA, EUR, USD)',
      'PWA — accessible sans installation',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }}
      />
    </>
  );
}
