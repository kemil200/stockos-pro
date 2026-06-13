export function JsonLd() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stockos.site';

  const westAfricanCountries = [
    'TG', 'BJ', 'CI', 'SN', 'GN', 'ML', 'BF', 'NE', 'GH', 'NG',
  ];

  const citiesServed = [
    'Lomé', 'Abidjan', 'Dakar', 'Cotonou', 'Ouagadougou',
    'Bamako', 'Niamey', 'Conakry', 'Accra', 'Lagos',
    'Porto-Novo', 'Bouaké', 'Saint-Louis', 'Parakou', 'Bobo-Dioulasso',
  ];

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'StockOS Pro',
    alternateName: 'StockOS',
    url: appUrl,
    logo: `${appUrl}/icon.svg`,
    description:
      'ERP/SaaS de gestion commerciale, facturation et stock pour PME en Afrique de l\'Ouest. Disponible au Togo, Bénin, Côte d\'Ivoire, Sénégal, Guinée, Mali, Burkina Faso, Niger, Ghana et Nigeria.',
    foundingDate: '2025',
    founder: { '@type': 'Person', name: 'StockOS Pro' },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['fr', 'en'],
    },
    areaServed: westAfricanCountries.map((code) => ({
      '@type': 'Country',
      name: code,
    })),
    sameAs: [appUrl],
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'StockOS Pro',
    url: appUrl,
    description:
      'Logiciel SaaS de gestion commerciale pour PME en Afrique de l\'Ouest. Facturation, gestion de stock, caisse enregistreuse, rapports.',
    inLanguage: ['fr', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${appUrl}/sign-in?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const software = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'StockOS Pro',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Android, iOS',
    url: appUrl,
    description:
      'Application SaaS de gestion commerciale multi-devises (FCFA, EUR, USD). Facturation, caisse, stock et rapports. PWA sans installation.',
    offers: {
      '@type': 'Offer',
      price: '90000',
      priceCurrency: 'XOF',
      description: 'Abonnement annuel — 90 000 FCFA pour les PME ouest-africaines',
      availability: 'https://schema.org/InStock',
      eligibleRegion: westAfricanCountries.map((code) => ({
        '@type': 'Country',
        name: code,
      })),
    },
    browserRequirements: 'Navigateur web moderne (Chrome, Firefox, Safari, Edge)',
    featureList: [
      'Facturation professionnelle avec tickets thermiques',
      'Gestion de stock en temps réel avec alertes',
      'Caisse enregistreuse intégrée (point de vente)',
      'Rapports et analyses de performance',
      'Multi-devises (FCFA, EUR, USD, NGN, GHS)',
      'PWA — fonctionne sans installation sur mobile',
      'Mode hors-ligne pour zones à connexion limitée',
      'Interface en français',
    ],
    areasServed: citiesServed.map((city) => ({
      '@type': 'City',
      name: city,
    })),
  };

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Qu\'est-ce que StockOS Pro ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'StockOS Pro est un logiciel SaaS de gestion commerciale conçu pour les PME en Afrique de l\'Ouest. Il permet de gérer la facturation, le stock, la caisse enregistreuse, les paiements et les rapports depuis n\'importe quel appareil connecté, sans installation.',
        },
      },
      {
        '@type': 'Question',
        name: 'StockOS Pro fonctionne-t-il sans connexion Internet ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Oui, StockOS Pro est une PWA (Progressive Web App) qui fonctionne même avec une connexion limitée ou hors-ligne. Vous pouvez continuer à enregistrer des ventes et l\'application synchronisera les données dès que la connexion est rétablie.',
        },
      },
      {
        '@type': 'Question',
        name: 'Quels pays sont couverts par StockOS Pro ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'StockOS Pro est disponible au Togo, Bénin, Côte d\'Ivoire, Sénégal, Guinée, Mali, Burkina Faso, Niger, Ghana et Nigeria. L\'interface est en français et le système supporte les devises locales (FCFA, NGN, GHS, EUR, USD).',
        },
      },
      {
        '@type': 'Question',
        name: 'Combien coûte StockOS Pro ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'StockOS Pro propose un essai gratuit de 30 jours. L\'abonnement annuel est de 90 000 FCFA, soit moins de 7 500 FCFA par mois. Des plans adaptés aux différentes tailles de commerces sont disponibles.',
        },
      },
    ],
  };

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'StockOS Pro',
    url: appUrl,
    description:
      'Solution SaaS de gestion commerciale pour les PME et commerces en Afrique de l\'Ouest.',
    priceRange: '7500 FCFA/mois',
    currenciesAccepted: 'XOF, XAF, NGN, GHS, EUR, USD',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Lomé',
      addressCountry: 'TG',
    },
    telephone: '+228 92 29 48 58',
    areaServed: citiesServed.map((city) => ({
      '@type': 'City',
      name: city,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
    </>
  );
}
