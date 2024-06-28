import Head from "next/head";
import styles from "@/styles/Home.module.css";
import Landing from "@/landing";

export default function Home() {
  return (
    <>
      <Head>
        <title>Schoolwheelz</title>
        <meta name="description" content="Connecting Parents with Safe and Reliable Rides for their kids' school trips." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main}`}>
        <Landing />
      </main>
    </>
  );
}
