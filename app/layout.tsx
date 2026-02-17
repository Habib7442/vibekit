import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://design.imagestudiolab.com'),
  title: {
    default: "ImageStudioLab | Professional AI Design Studio",
    template: "%s | ImageStudioLab"
  },
  description: "Create premium product photography, editorial fashion, and stunning mobile app designs with the world's most advanced AI creative engine.",
  keywords: ["AI Design", "Product Photography", "AI Fashion", "App Builder", "Creative Engine", "ImageStudioLab", "Generative AI"],
  authors: [{ name: "ImageStudioLab Team" }],
  creator: "ImageStudioLab",
  publisher: "ImageStudioLab",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://design.imagestudiolab.com',
    siteName: 'ImageStudioLab',
    title: 'ImageStudioLab | Professional AI Design Studio',
    description: "Create premium product photography, editorial fashion, and stunning mobile app designs with the world's most advanced AI creative engine.",
    images: [
      {
        url: '/og-image.png', // User should ensure this exists
        width: 1200,
        height: 630,
        alt: 'ImageStudioLab - Professional AI Design Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ImageStudioLab | Professional AI Design Studio',
    description: "Create premium product photography, editorial fashion, and stunning mobile app designs with the world's most advanced AI creative engine.",
    creator: '@imagestudiolab',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-black text-white`} suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
