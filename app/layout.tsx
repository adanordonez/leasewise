import type { Metadata } from "next";
import { Inter, Comfortaa } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const comfortaa = Comfortaa({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-comfortaa"
});

export const metadata: Metadata = {
  title: "LeaseChat - AI Lease Analysis | Know Your Rights",
  description: "Upload your lease PDF and get instant AI analysis of terms, rights, and red flags. Know your lease, know your rights. Powered by University of Chicago Law School AI Lab.",
  keywords: [
    "lease analysis", 
    "tenant rights", 
    "AI legal analysis", 
    "lease review", 
    "rental agreement",
    "lease terms",
    "tenant protection",
    "rental law",
    "lease red flags",
    "tenant rights analysis",
    "lease contract review",
    "rental agreement analysis"
  ],
  authors: [{ name: "University of Chicago Law School AI Lab" }],
  creator: "University of Chicago Law School AI Lab",
  publisher: "LeaseChat",
  applicationName: "LeaseChat",
  category: "Legal Technology",
  
  // Open Graph tags for social media sharing
  openGraph: {
    title: "LeaseChat - AI Lease Analysis | Know Your Rights",
    description: "Upload your lease PDF and get instant AI analysis of terms, rights, and red flags. Know your lease, know your rights. Powered by University of Chicago Law School AI Lab.",
    url: "https://getleasechat.com ",
    siteName: "LeaseChat",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LeaseChat - AI Lease Analysis Platform showing lease document analysis interface",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
    countryName: "United States",
  },
  
  // Twitter Card tags
  twitter: {
    card: "summary_large_image",
    title: "LeaseChat - AI Lease Analysis | Know Your Rights",
    description: "Upload your lease PDF and get instant AI analysis of terms, rights, and red flags. Know your lease, know your rights.",
    images: ["/og-image.png"],
    creator: "@UChicagoLaw",
    site: "@LeaseChatApp",
    imageAlt: "LeaseChat - AI Lease Analysis Platform showing lease document analysis interface",
  },
  
  // Additional meta tags for SEO
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Additional social media and SEO meta tags
  other: {
    // Open Graph additional tags
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:type': 'image/png',
    'og:image:secure_url': 'https://getleasechat.com/og-image.png',
    'og:updated_time': new Date().toISOString(),
    
    // Twitter additional tags
    'twitter:image:alt': 'LeaseChat - AI Lease Analysis Platform showing lease document analysis interface',
    'twitter:site': '@LeaseChatApp',
    'twitter:domain': 'getleasechat.com',
    'twitter:app:name:iphone': 'LeaseChat',
    'twitter:app:name:ipad': 'LeaseChat',
    'twitter:app:name:googleplay': 'LeaseChat',
    
    // Additional SEO tags
    'theme-color': '#8b5cf6',
    'msapplication-TileColor': '#8b5cf6',
    'msapplication-config': '/browserconfig.xml',
    
    // App-specific tags
    'application-name': 'LeaseChat',
    'apple-mobile-web-app-title': 'LeaseChat',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    
    // Legal and compliance
    'copyright': 'University of Chicago Law School AI Lab',
    'language': 'en-US',
    'revisit-after': '7 days',
    'distribution': 'global',
    'rating': 'general',
  },
  
  // Icons are auto-detected from app/icon.svg
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  
  return (
    <html lang="en">
      <body className={`${inter.className} ${comfortaa.variable}`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
