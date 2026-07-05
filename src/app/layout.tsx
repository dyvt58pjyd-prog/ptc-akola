import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import SplashScreen from "@/components/SplashScreen";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getSession } from "@/lib/auth";
import { Mukta } from "next/font/google";

const mukta = Mukta({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['devanagari', 'latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: "#0A192F",
};

export const metadata: Metadata = {
  title: "Police Training Centre Akola",
  description: "Recruit Training Tracker System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PTC Tracker",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en">
      <body className={mukta.className}>
        <ThemeProvider>
          <SplashScreen />
          <div className="app-container">
            {/* Sidebar Navigation */}
            <Sidebar role={session?.role || null} />

            {/* Main Content Area */}
            <main className={session?.role ? "main-content" : "main-content-full"}>
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
