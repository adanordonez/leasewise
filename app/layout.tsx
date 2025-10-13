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
  description: "Know your lease, know your rights",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${comfortaa.variable}`}>{children}</body>
    </html>
  );
}
