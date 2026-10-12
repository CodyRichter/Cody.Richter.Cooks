import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/tiptap/styles.css";
import "@/styles/styles.css";

import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { Providers } from "@/app/providers";
import { AppLayout } from "@/app/AppLayout";
import type { Metadata } from "next";
import { siteUrl } from "@/config/environment";
import { SIDEBAR_RECIPES_PER_PAGE } from "@/config/pagination";
import { fetchRecipeListForServer } from "@/utils/recipeServer";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Cody Richter Cooks",
  description: "Recipes and cooking guides from Cody Richter and friends.",
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarRecipes = await fetchRecipeListForServer(1, SIDEBAR_RECIPES_PER_PAGE);

  return (
    <html lang="en" className={`${inter.variable}`} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <Providers>
          <AppLayout initialSidebarRecipes={sidebarRecipes ?? undefined}>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
