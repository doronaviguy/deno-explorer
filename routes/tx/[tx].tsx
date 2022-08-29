/** @jsx h */
import { h } from "preact";
import { Handlers, PageProps } from "$fresh/server.ts";
import { createRequire } from "https://deno.land/std@0.153.0/node/module.ts";
import { Buffer } from "http://deno.land/x/node_buffer/index.ts";
import { tw } from "@twind";
const require = createRequire(import.meta.url);
const { Cell, parseTransaction, beginCell, fromNano, Address } = require("ton");

interface Transaction {
  data: string;
  date: string;
}

export const handler: Handlers<Transaction | null> = {
  async GET(_, ctx) {
    const tx = decodeURI(ctx.params.tx);
    const address = Address.parse(tx.split("|")[0]);
    const lt = tx.split("|")[1];
    const hash = Buffer.from(tx.split("|")[2], "base64");

    const postBody = {
      "id": "1",
      "jsonrpc": "2.0",
      "method": "getTransactions",
      "params": {
        "address": address.toString(),
        "limit": 1,
        "hash": hash.toString("hex"),
        lt: lt,
      },
    };

    const jsonResponse = await fetch(
      `https://scalable-api.tonwhales.com/jsonRPC`,
      {
        body: JSON.stringify(postBody),
        method: "post",
        headers: {
          accept: "application/json, text/plain, */*",
          "content-type": "application/json",
        },
      },
    );

    const jsonData = await jsonResponse.json();
    const txs = jsonData.result as Transaction[];
    return ctx.render(txs[0]);
  },
};

export default function TransactionDetailed(
  { data, params }: PageProps<Transaction[] | null>,
) {
  const currentContract = data["in_msg"]["destination"];

  let boc = Cell.fromBoc(Buffer.from(data.data, "base64"));
  const wc = Address.parse(currentContract).workchain;
  let txData = parseTransaction(wc, boc[0].beginParse());
  console.log("txData", txData);

  return (
    <div class={tw`p-4 mx-auto max-w-screen-md`}>
      <p class={tw`my-2 text-2xl m-4 font-medium`}>
        <a class={tw``} href={`/address/${currentContract}`}>
          👾{currentContract}
        </a>
      </p>
      <p class={tw`my-2 text-6xl m-4 font-medium`}>Transaction</p>
      <div
        class={tw`grid grid-cols-4 gap-4 content-start bg-white border-b dark:bg-gray-800 dark:border-gray-700`}
      >
        <div>Status :{txData.newStatus}</div>
        <div>Dest</div>
        <div>Value</div>
        <div>Fee</div>
      </div>
      {Tx(data, txData)}
    </div>
  );
}

function Tx(element, txData) {
  return (
    <div
      class={tw`bg-white border-b dark:bg-gray-800 dark:border-gray-700 p-1 `}
    >
      <div class={tw`space-y-3`}>
        <div>{new Date(parseInt(element["utime"]) * 1000).toISOString()}</div>
      </div>
      <div class={tw` gap-4 content-start`}>
        <pre>{ beginCell().storeBuffer(Buffer.from(element["in_msg"]["message"], "base64")).endCell().toString()}</pre>
        <div>➡️ From :{element["in_msg"]["source"]}</div>
        <div>💎 Value :{fromNano(element["in_msg"]["value"]).toString()}</div>
        <div>⛽️ Fee:{fromNano(element["fee"]).toString().substring(0, 6)}</div>

        {Actions(element["out_msgs"], txData)}
      </div>
    </div>
  );
}

function Actions(data: Array<any>, txData) {
  let list = data.map((element, i) => {
    let body = txData.outMessages[i].body;
    let action = txData.outMessages[i];
    console.log(action);

    let value = fromNano(action.info.value.coins.toString());

    return (
      <div class={tw`grid grid-cols-3 content-start p-2  border-t`}>
        <div class={tw`flex`} title={body}>
          Action:
          {body.toString().substring(0, 15)}
        </div>
        <div>➡️ {value.substring(0, 8)} 💎</div>
        <div>{element["destination"]}</div>
      </div>
    );
  });

  return (
    <div>
      <div class={tw`text-2xl m-4 font-medium gap-y-4`}>Outgoing Actions</div>
      {list}
    </div>
  );
}
