import { ThemeProvider } from "@/context/ThemeContext";
import type { AppProps } from "next/app";
import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }: AppProps) {
  const [isComponentRendered, setIsComponentRendered] = React.useState(false);

  React.useEffect(() => {
    setIsComponentRendered(true);
  }, []);

  if (!isComponentRendered) {
    return null;
  }
  return (
      <ThemeProvider>
        <Component {...pageProps} />
        <Toaster />
      </ThemeProvider>
  );
}