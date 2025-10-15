import type { Metadata } from "next";
import { Inter, Comfortaa } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const comfortaa = Comfortaa({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-comfortaa"
});

export const metadata: Metadata = {
  title: "LeaseWise - AI Lease Analysis",
  description: "Know your lease, know your rights. Upload your lease PDF and get instant AI analysis of terms, rights, and red flags.",
  keywords: ["lease analysis", "tenant rights", "AI legal analysis", "lease review", "rental agreement"],
  authors: [{ name: "University of Chicago Law School AI Lab" }],
  creator: "University of Chicago Law School AI Lab",
  publisher: "LeaseWise",
  
  // Open Graph tags for social media sharing
  openGraph: {
    title: "LeaseWise - AI Lease Analysis",
    description: "Upload your lease PDF and get instant AI analysis of terms, rights, and red flags. Know your lease, know your rights.",
    url: "https://getleasewise.com",
    siteName: "LeaseWise",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "LeaseWise - AI Lease Analysis",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  
  // Twitter Card tags
  twitter: {
    card: "summary_large_image",
    title: "LeaseWise - AI Lease Analysis",
    description: "Upload your lease PDF and get instant AI analysis of terms, rights, and red flags.",
    images: ["/api/og"],
    creator: "@UChicagoLaw",
  },
  
  // Additional meta tags
  robots: {
    index: true,
    follow: true,
  },
  // Icons are auto-detected from app/icon.svg
  
  // Additional social media meta tags
  other: {
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:type': 'image/png',
    'twitter:image:alt': 'LeaseWise - AI Lease Analysis Platform',
    'twitter:site': '@LeaseWiseApp',
    'twitter:domain': 'getleasewise.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${comfortaa.variable}`} suppressHydrationWarning>{children}</body>
    </html>
  );
}
