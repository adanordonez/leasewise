import LeaseWiseApp from '@/components/LeaseWiseApp';

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "LeaseChat",
    "alternateName": "LeaseChat AI Lease Analysis",
    "description": "Upload your lease PDF and get instant AI analysis of terms, rights, and red flags. Know your lease, know your rights.",
    "url": "https://getleasechat.com",
    "applicationCategory": "LegalTechApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free AI-powered lease analysis"
    },
    "creator": {
      "@type": "Organization",
      "name": "University of Chicago Law School AI Lab",
      "url": "https://www.law.uchicago.edu/"
    },
    "publisher": {
      "@type": "Organization",
      "name": "LeaseChat",
      "url": "https://getleasechat.com"
    },
    "featureList": [
      "AI-powered lease analysis",
      "Red flag detection",
      "Tenant rights analysis",
      "PDF document processing",
      "Legal term explanation",
      "Source attribution"
    ],
    "screenshot": "https://getleasewise.com/og-image.png",
    "softwareVersion": "1.0.0",
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString(),
    "inLanguage": "en-US",
    "isAccessibleForFree": true,
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "permissions": "camera, microphone",
    "memoryRequirements": "256MB",
    "storageRequirements": "10MB"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LeaseWiseApp />
    </>
  );
}
