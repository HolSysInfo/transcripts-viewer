import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "SysInfo Transcripts Viewer",
  description: "View your SysInfo tickets transcripts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`font-['GGSans'] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
