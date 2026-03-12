import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axon — AI Workspace",
  description: "Turn your inbox into a structured workflow with AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
            document.documentElement.classList.toggle('dark', t === 'dark');
          } catch(e){}
        `}} />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" toastOptions={{
            style: {
              background: "var(--card)", color: "var(--text)",
              border: "1px solid var(--border)", borderRadius: "4px",
              fontSize: "13px", fontFamily: "'Space Grotesk', sans-serif",
            },
            success: { iconTheme: { primary: "#FF4D00", secondary: "#fff" } },
          }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
