import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata = {
  title: { default: "EduManage", template: "%s · EduManage" },
  description: "EduManage – Education Management Software",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
