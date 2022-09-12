/** @jsx h */
import { h } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { tw } from "@twind";
import Search from "../islands/Search-header.tsx";

export function Footer(props: h.JSX.HTMLAttributes<HTMLButtonElement>) {
  return (
          
      <footer class={tw`p-4 bg-white rounded-lg shadow md:flex md:items-center md:justify-between md:p-6 dark:bg-gray-800`}>
          <span class={tw`flex text-sm text-gray-500 sm:text-center dark:text-gray-400`}>©  
            <a href="https://ton.deno.dev/" class={tw`hover:underline`}>T💎n Bay 🌴</a></span> Powered by  <img style={`margin-left:4px; margin-right:4px; height:18px`} class={tw`h`} src="https://deno.land/logo.svg?__frsh_c=z9r8d1m19590" alt="Deno Logo"></img> deno &   
            <img src="/logo.svg" style={`margin-left:4px; margin-right:4px; height:18px`}  alt="the fresh logo: a sliced lemon dripping with juice"/>fresh  .
          
          <ul class={tw`flex flex-wrap items-center mt- text-sm text-gray-500 dark:text-gray-400 sm:mt-0`}>
              <li>
              
              </li>
              <li>
                  
              </li>
              <li>
                  
              </li>
              <li>
                  <a href="https://dash.deno.com/projects/doronaviguy-deno-explorer" class={tw`hover:underline`}>
                  <svg class="hover:text-default-highlight" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_1989_191)"><path d="M7.00001 0C3.13391 0 0 3.21295 0 7.17755C0 10.3482 2.0055 13.0388 4.7873 13.9875C5.1373 14.0534 5.26471 13.832 5.26471 13.6414C5.26471 13.4716 5.25912 13.0195 5.25561 12.4212C3.3082 12.8547 2.8973 11.4589 2.8973 11.4589C2.5795 10.6291 2.1203 10.4084 2.1203 10.4084C1.48471 9.96418 2.16861 9.97279 2.16861 9.97279C2.87071 10.0229 3.24032 10.7122 3.24032 10.7122C3.86472 11.8085 4.87903 11.4918 5.27732 11.3084C5.34171 10.8448 5.52232 10.5288 5.72251 10.3497C4.16851 10.1684 2.534 9.55218 2.534 6.80211C2.534 6.01893 2.807 5.37764 3.2543 4.87605C3.1822 4.69476 2.94211 3.96463 3.32289 2.97722C3.32289 2.97722 3.91089 2.78376 5.24789 3.71238C5.77305 3.55992 6.37629 3.47184 6.99948 3.4709C7.59448 3.47377 8.19351 3.5533 8.7528 3.71238C10.0891 2.78376 10.6757 2.97649 10.6757 2.97649C11.0579 3.9646 10.8171 4.69475 10.7457 4.87603C11.1937 5.3776 11.4653 6.0189 11.4653 6.80208C11.4653 9.55931 9.82799 10.1662 8.26908 10.3439C8.52037 10.5653 8.74368 11.0031 8.74368 11.6731C8.74368 12.6318 8.73529 13.4064 8.73529 13.6414C8.73529 13.8335 8.86129 14.057 9.21689 13.9868C12.0205 13.0032 14 10.3285 14 7.18046C14 7.17943 14 7.17841 14 7.17738C14 3.21278 10.8654 0 7.00001 0Z" fill="currentColor"></path></g><defs><clipPath id="clip0_1989_191"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg>
                  </a>
              </li>
          </ul>
      </footer>

  );
}
