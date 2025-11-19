import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CVre",
  description: "Application local-first pour optimiser votre CV ATS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
            <footer className="border-t py-6">
              <div className="container mx-auto flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span>Made with &lt;3 by</span>
                  <a
                    href="https://github.com/lugnicca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline underline-offset-4"
                  >
                    lugnicca
                  </a>
                </div>
                <a
                  href="https://github.com/lugnicca/cvre"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground hover:underline underline-offset-4 transition-colors"
                >
                  View on GitHub
                </a>
              </div>
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
