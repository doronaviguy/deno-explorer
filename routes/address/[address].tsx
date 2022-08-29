/** @jsx h */
import { h } from "preact";
import { Handlers, PageProps } from "$fresh/server.ts";
import { createRequire } from "https://deno.land/std@0.153.0/node/module.ts";
import { tw } from "@twind";

const require = createRequire(import.meta.url);
const { Cell, parseTransaction, beginCell, fromNano, Address } = require("ton");

export function addressEllipsis(address: string) {
  if (!address) {
    return `...`;
  }

  if (typeof address == "object") {
    // @ts-ignore
    address = address.toFriendly();
  }

  return `${address.substring(0, 6)}....${address.substring(42, 48)}`;
}

interface Transaction {
  data: string;
  date: string;
}

export const handler: Handlers<Transaction[] | null> = {
  async GET(_, ctx) {
    let address = Address.parse(ctx.params.address);

    const jsonResponse = await fetch(
      `https://scalable-api.tonwhales.com/jsonRPC`,
      {
        body:
          `{"id":"1","jsonrpc":"2.0","method":"getTransactions","params":{"address":"${address.toString()}","limit":200}}`,
        method: "post",
        headers: {
          accept: "application/json",
        },
      },
    );

    const jsonData = await jsonResponse.json();

    const txs = jsonData.result as Transaction[];

    return ctx.render(txs);
  },
};

export default function Transactions(
  { data, params }: PageProps<Transaction[] | null>,
) {
  let list = data.map((element) => {
    console.log(element);

    return <div>{Tx(element)}</div>;
  });

  return (
    <div class={tw`p-4 mx-auto max-w-screen-md`}>
      <p class={tw`my-2 text-xl5 font-medium`}>
        {params.address}
      </p>

      {list}
    </div>
  );
}

function Tx(element: any) {
  let href = `/tx/` +
    encodeURI(
      `${element.in_msg.destination.toString()}|${element.transaction_id.lt}|${element.transaction_id.hash}`,
    );
  return (
    <div
      class={tw`bg-white border- dark:bg-gray-800 dark:border-gray-700 p-1 `}
    >
      <div class={tw`grid grid-cols-1 content-end space-y-3 align-right`}>
        <div>
          <a class={tw`text-cyan-500`} href={href}>
            {new Date(parseInt(element["utime"]) * 1000).toISOString()}
          </a>
        </div>
      </div>
      <div class={tw`grid grid-cols-4 gap-4 content-start`}>
        <div>{addressEllipsis(element["in_msg"]["source"])} ➡️</div>
        <div>Value:{fromNano(element["in_msg"]["value"]).toString()}💎</div>
        <div>Fee:{fromNano(element["fee"]).toString().substring(0, 6)}💎</div>
      </div>

      {Actions(element["out_msgs"])}
    </div>
  );
}

function Actions(data: Array<any>) {
  let list = data.map((element) => {
    let body = element["msg_data"]["body"];
    const bodyShort = element["msg_data"]["body"].substring(0, 20);
    let cell = beginCell().storeBuffer(Buffer.from(body, "base64")).endCell();
    console.log(cell.toString());

    return (
      <div class={tw`grid grid-cols-3 content-start p-2  border-`}>
        <div class={tw`flex`} title={body}>
          Action: ({cell.toString().substring(0, 20)})
        </div>
        <div>➡️</div>
        <div>{addressEllipsis(element["destination"])}</div>
      </div>
    );
  });

  return list;
}
