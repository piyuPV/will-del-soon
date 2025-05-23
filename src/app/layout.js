import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import MentorChatBot from "@/components/MentorChatBot";
import { ReactQueryProviders } from "./provider/reactQueryProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster position="top-center" />
        <ReactQueryProviders>
        <MentorChatBot/>
          {children}
        </ReactQueryProviders>
      </body>
    </html>
  );
}
