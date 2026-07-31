import Navbar from '../components/Navbar/Navbar';
import Hero from '../components/Hero/Hero';
import Footer from '../components/Footer/Footer';
import SupportWidget from '../components/SupportWidget/SupportWidget';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
      </main>
      <Footer />
      <SupportWidget />
    </>
  );
}
