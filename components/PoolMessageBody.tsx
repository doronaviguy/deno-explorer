/** @jsx h */
import { h } from "preact";
import { Avatar } from "./Avatar.tsx";
import { tw } from "@twind";
import { strToCell } from "../utils/utils.ts";
import { parseDexBoc } from "../utils/message-parser.ts";

export function PoolMessageBody(messageBody: string) {
    let parsedData = parseDexBoc(messageBody, "base64")
    let str = '';
    for(let key in parsedData) {
        str += `${key}: ${parsedData[key]}\n\t`;
    }
  return <pre
    class={tw`max-h-30 text-xs m-1 ml-5`}
    style={`color:#506f9c`}
  >{ str }</pre>;
}
