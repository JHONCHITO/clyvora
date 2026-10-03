import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clyvora | Social intelligence",
  description: "Sistema profesional para diseñar, operar y aprender de contenido social.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
