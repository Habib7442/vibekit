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
  metadataBase: new URL('https://www.visualaistudio.com'),
  title: {
    default: "VisualAI Studio | AI-Native Design Platform",
    template: "%s | VisualAI Studio"
  },
  description: "Create professional eCommerce product photos, brand kits, and campaign assets with VisualAI Studio. The AI-native design platform for modern teams.",
  keywords: ["AI Design", "Product Photography", "Brand Kit", "Marketing AI", "Campaign Assets", "VisualAI Studio", "Generative AI"],
  authors: [{ name: "VisualAI Studio Team" }],
  creator: "VisualAI Studio",
  publisher: "VisualAI Studio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.visualaistudio.com',
    siteName: 'VisualAI Studio',
    title: 'VisualAI Studio | AI-Native Design Platform',
    description: "Create professional eCommerce product photos, brand kits, and campaign assets with VisualAI Studio. The AI-native design platform for modern teams.",
    images: [
      {
        url: '/og_image.png',
        width: 1200,
        height: 630,
        alt: 'VisualAI Studio - AI-Native Design Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VisualAI Studio | AI-Native Design Platform',
    description: "Create professional eCommerce product photos, brand kits, and campaign assets with VisualAI Studio. The AI-native design platform for modern teams.",
    creator: '@visualaistudio',
    images: ['/og_image.png'],
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
