/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import Search from "../islands/Search.tsx";
import { TopHeader } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";

export default function Home() {
  return (
    <div class={tw`p-4 mt-20 mx-auto max-w-screen-md`}>
      
      <p class={tw`my-10 text-center text-5xl font-medium`}>
        T💎N Bay
      </p>
      <Search />

      <div class={tw`h-4/5 text-2xl m-10`}>
    
      </div>
      <TopHeader />
      <Footer />
    </div>
  );
}
