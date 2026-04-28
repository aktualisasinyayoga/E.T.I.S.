import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "E.T.I.S",
  description: "Portal Pengembangan Sumber Daya Manusia Kementerian Hak Asasi Manusia Republik Indonesia. Monitoring Jam Pelajaran, Upload Sertifikat, dan Informasi Pelatihan.",
  keywords: ["HAM", "Kementerian", "PPSDM", "Pelatihan", "Sertifikat", "Pengembangan SDM"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakartaSans.className} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
