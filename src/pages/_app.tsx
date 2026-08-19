import type { AppProps } from "next/app";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "@/styles/globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${sourceSans.variable} ${fraunces.variable} font-sans`}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </div>
  );
}
