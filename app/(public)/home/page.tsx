'use client';

import Clients from "@/app/components/Clients";
import Cta from "@/app/components/Cta";
import Footer from "@/app/components/Footer";
import Hero from "@/app/components/Hero";
import Intro from "@/app/components/Intro";
import Portfolio from "@/app/components/Portfolio";
import Services from "@/app/components/Services";

const home = () => {
  return (
    <>
        <Hero />
        <Intro />
        <Services />
        <Portfolio />
        <Clients />
        <Cta/>
        <Footer />
    </>)
};

export default home;
