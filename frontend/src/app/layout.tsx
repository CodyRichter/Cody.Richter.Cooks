import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/tiptap/styles.css";
import "@/styles/styles.css";

import { ColorSchemeScript } from "@mantine/core";
import { Providers } from "@/app/providers";
import { AppLayout } from "@/app/AppLayout";
import type { Metadata } from "next";
import { Inter, Nunito_Sans } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});


export const metadata: Metadata = {
  title: "Cody Richter Cooks",
  description: "A culinary platform",
  icons: {
    icon: "/chef-hat.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
