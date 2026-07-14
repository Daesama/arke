import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://arkei.co"),
  title: {
    default: "ARKE | Camisetas Personalizadas en Bogotá",
    template: "%s | ARKE",
  },
  description:
    "Diseña tu camiseta personalizada en Bogotá. Sube tu imagen, elige tu talla y material, y recíbela en casa. ARKE — Tu imagen. Tu camisa.",
  keywords: [
    "camisetas personalizadas Bogotá",
    "camisetas personalizadas Colombia",
    "estampado personalizado Bogotá",
    "diseña tu camiseta",
    "ARKE",
    "arkei",
    "camisetas gamer Colombia",
    "camisetas anime Bogotá",
    "ropa personalizada Colombia",
    "camisetas con diseño propio",
  ],
  authors: [{ name: "ARKE", url: "https://arkei.co" }],
  creator: "ARKE",
  icons: {
    icon: "/brand/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://arkei.co",
    siteName: "ARKE",
    title: "ARKE | Camisetas Personalizadas en Bogotá",
    description:
      "Diseña tu camiseta personalizada. Sube tu imagen y recíbela en Bogotá.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ARKE — Camisetas Personalizadas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ARKE | Camisetas Personalizadas en Bogotá",
    description:
      "Diseña tu camiseta personalizada. Sube tu imagen y recíbela en Bogotá.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://arkei.co",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-void text-text-primary font-body">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
