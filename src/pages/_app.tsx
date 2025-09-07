import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/context/ThemeContext";
import type { AppProps } from "next/app";
import React from 'react';
import { Toaster } from 'react-hot-toast';
import styled from 'styled-components';

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

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
      <Layout>
        <Navbar />
        <MainContent>
          <Component {...pageProps} />
        </MainContent>
        <Footer />
        <Toaster />
      </Layout>
    </ThemeProvider>
  );
}