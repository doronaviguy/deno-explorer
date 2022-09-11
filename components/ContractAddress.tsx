/** @jsx h */
import { h } from "preact";
import { Avatar } from "./Avatar.tsx";
import { tw } from "@twind";

export function ContractAddress(address: string) {
  if (!address) {
    return ``;
  }

  if (typeof address == "object") {
    // @ts-ignore
    address = address.toFriendly();
  }

  return (
    <a
      style={`color:#4280f0; display:inline-flex; position:relative; top:6px;`}
      class={tw`flex opacity-90 hover:opacity-100 hover:underline `}
      href={`/address/${address}`}
    >
      <span>
        <Avatar address={address} size={25}></Avatar>
      </span>
      <span style={`padding-left:5px; `} class={tw`p-l-5`}>
        {address.substring(0, 6)}....{address.substring(42, 48)}
      </span>
    </a>
  );
}
