import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chemistry 3D Simulations & Challenges",
  description: "Interactive real-time 3D Chemistry Simulations and Challenges for Chemical Bonding, VSEPR, Hybridization, and Molecular Orbital Theory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-[#040712] text-slate-100 antialiased select-none overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
