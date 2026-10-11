import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/utils/providers/AppProviders";
import AppShell from "@/components/containers/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata = {
  title: "Spending Insights | Capitec",
  description: "See where your money goes: spending by category, monthly trends and budgets.",
  icons: { icon: "/favicon.svg" },
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
