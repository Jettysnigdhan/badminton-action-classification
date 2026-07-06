import { SITE, PAPER } from "./data";

// Schema.org structured data — ScholarlyArticle + SoftwareApplication.
export function buildJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ScholarlyArticle",
        headline: PAPER.title,
        abstract: PAPER.abstract,
        author: { "@type": "Organization", name: SITE.authorsShort },
        keywords: [
          "badminton",
          "action recognition",
          "human pose estimation",
          "AlphaPose",
          "skeleton data",
          "LSTM",
          "CNN",
          "sports analytics",
        ],
        inLanguage: "en",
        isAccessibleForFree: true,
        url: SITE.url,
      },
      {
        "@type": "SoftwareApplication",
        name: SITE.name,
        applicationCategory: "ResearchApplication",
        operatingSystem: "Web",
        description: SITE.description,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ],
  };
}
