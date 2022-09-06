/** @jsx h */
import { h } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { tw } from "@twind";
import Search from "../islands/Search-header.tsx";

export function TopHeader(props: h.JSX.HTMLAttributes<HTMLButtonElement>) {
  return (
    <div style={`position:fixed; height: 2rem; display:flex;    background-color: #b2b2c8;
    left: 0;
    right: 0;
    top: 0;`} class={tw``}>
        <span class={tw`p-4 font-family:consals color-white`}>Ton Bay</span>
        <Search />
    </div>
  );
}
