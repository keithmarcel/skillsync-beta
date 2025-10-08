import type { Metadata } from "next";
import { Inter, Source_Sans_3 } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { ViewAsProvider } from "@/contexts/ViewAsContext";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const sourceSansPro = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-source-sans-pro",
});

export const metadata: Metadata = {
  title: "SkillSync - Skills Assessment & Job Matching",
  description: "Assess your skills, discover career opportunities, and find educational programs in Pinellas County, FL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.className} ${sourceSansPro.variable} antialiased bg-gray-50`}>
        <AuthProvider>
          <ViewAsProvider>
            {children}
            <Toaster />
          </ViewAsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
