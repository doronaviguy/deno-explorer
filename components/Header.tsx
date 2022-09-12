/** @jsx h */
import { h } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { tw } from "@twind";
import Search from "../islands/Search-header.tsx";

export function TopHeader(props: h.JSX.HTMLAttributes<HTMLButtonElement>) {
  return (
    <div style={`position:fixed; height: 2.5rem; display:flex;    background-color: #b2b2c8;
    left: 0;
    right: 0;
    top: 0;`} class={tw`shadow-lg`}>
        <a href="/"><span style={`color:#fff; position:relative; top:-5px; font-size:1.9rem;     text-shadow: -1px 2px 3px black;`} class={tw`p-4 font-family: color-white`}>T💎N Bay 🏝</span></a>
        <div class={tw`w-1/3`} style={` margin-left: auto; margin-right: 1rem;`}>
        <Search />

        </div>
    </div>
  );
}
