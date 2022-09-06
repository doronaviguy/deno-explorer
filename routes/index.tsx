/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import Search from "../islands/Search.tsx";

export default function Home() {
  return (
    <div class={tw`p-4 mx-auto max-w-screen-md`}>
      
      <p class={tw`my-10  text-5xl font-medium`}>
        T💎N Bay
      </p>
      <Search />

      <div class={tw`flex text-2xl m-10`}>

      Powerd by fersh <img
        src="/logo.svg"
        height="400px"
        alt="the fresh logo: a sliced lemon dripping with juice"
        />
      </div>
    </div>
  );
}
