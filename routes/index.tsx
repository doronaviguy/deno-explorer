/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import Search from "../islands/Search.tsx";

export default function Home() {
  return (
    <div class={tw`p-4 mx-auto max-w-screen-md`}>
      <img
        src="/logo.svg"
        height="400px"
        alt="the fresh logo: a sliced lemon dripping with juice"
      />
      <p class={tw`my-2 text-5xl font-medium`}>
        💎 T0N Bay
      </p>
      <Search />
    </div>
  );
}
