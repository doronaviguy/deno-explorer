/** @jsx h */
import { h } from "preact";
import { useState } from "preact/hooks";
import { tw } from "@twind";

interface CounterProps {
  term: string;
}

export default function Search(props: CounterProps) {
  const [term, setTerm] = useState(props.term);
  return (
    <form>
      <label
        for="default-search"
        class={tw`mb-2 text-sm font-medium text-gray-900 sr-only dark:text-gray-300`}
      >
        Search
      </label>
      <div class={tw`relative`}>
        <div
          class={tw`flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none`}
        >
          <svg
            aria-hidden="true"
            class={tw`w-5 h-5 text-gray-500 dark:text-gray-400`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            >
            </path>
          </svg>
        </div>
        <input
          onKeyPress={(e) => {
            console.log(e);

            if (e.keyCode == 13) {
              console.log({ term });

              document.location = `/address/${term}`;
            }
          }}
          onChange={(e) => {
            setTerm(e.target.value);
          }}
          type="search"
          id="default-search"
          class={tw`block p-1 pl-4 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
          placeholder="Address, Contract"
        />
        <button
          type="button"
          onClick={() => document.location = `/address/${term}`}
          class={tw`bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800`}
        >
          Search
        </button>
      </div>
    </form>
  );
}