import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "StockwiseIN — Indian Stock Market Analysis",
  description: "Professional stock research and analysis platform for Indian markets (NSE & BSE). Get fundamentals, AI insights, news, and investment signals.",
  keywords: ["Indian stocks", "NSE", "BSE", "stock analysis", "fundamental analysis", "stock research"],
  openGraph: {
    title: "StockwiseIN",
    description: "Professional stock research and analysis platform for Indian markets",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <footer
              className="mt-16 py-8"
              style={{ borderTop: "1px solid var(--border-color)" }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
                    <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      StockwiseIN
                    </span>
                  </div>
                  <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                    For research & education only. Not financial advice. ©{new Date().getFullYear()} StockwiseIN
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Data: Yahoo Finance • NSE/BSE
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
