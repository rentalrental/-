import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "暖厨菜单",
  description: "私人厨房菜单更新与朋友提前点单"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
