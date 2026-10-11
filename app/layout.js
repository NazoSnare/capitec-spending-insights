import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/utils/providers/AppProviders";
import AppShell from "@/components/containers/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata = {
  title: "Spending Insights | Capitec",
  description: "See where your money goes: spending by category, monthly trends and budgets.",
  // Capitec's mark: SVG where the browser supports it, PNG otherwise, and a larger PNG
  // for an iPhone home screen.
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/favicon.png", type: "image/png", sizes: "64x64" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport = { themeColor: "#00486d", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en-ZA" className={inter.variable}>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
