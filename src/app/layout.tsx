import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Iceland, JetBrains_Mono, Public_Sans } from "next/font/google";
import { AppNavigation } from "~/components/AppNavigation";
import { ApolloWrapper } from "./ApolloWrapper";

export const metadata: Metadata = {
  title: "Health Dashboard",
  description: "A private, self-hosted dashboard for your health data",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const iceland = Iceland({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-iceland",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-public-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${iceland.variable} ${jetbrainsMono.variable} ${publicSans.variable}`}
    >
      <body className="bg-ink-900 text-ink-0">
        <ApolloWrapper>
          <AppNavigation />
          {children}
        </ApolloWrapper>
      </body>
    </html>
  );
}
