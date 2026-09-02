import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

import { AuthProvider } from "@/components/AuthProvider";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "Partnernet — Find your next business partner",
    template: "%s · Partnernet",
  },
  description:
    "Partnernet helps independent businesses find nearby partners who share their customers, not compete for them.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <ToastProvider>
            <NavBar />
            <main className="flex-1">{children}</main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
