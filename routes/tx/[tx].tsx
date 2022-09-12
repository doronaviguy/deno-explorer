/** @jsx h */
import { h } from "preact";
import { Handlers, PageProps } from "$fresh/server.ts";
import { createRequire } from "https://deno.land/std@0.153.0/node/module.ts";
import { Buffer } from "http://deno.land/x/node_buffer/index.ts";
import { tw } from "@twind";
const require = createRequire(import.meta.url);

import { Address, beginCell, fromNano } from "https://cdn.skypack.dev/ton";
import { parseTxDetails } from "../../utils/utils.ts";
import { Avatar } from "../../components/Avatar.tsx";
import { TopHeader } from "../../components/Header.tsx";
import { Footer } from "../../components/Footer.tsx";

interface Transaction {
  data: string;
  date: string;
}

export const handler: Handlers<Transaction | null> = {
  async GET(_, ctx) {
    const tx = decodeURIComponent(ctx.params.tx);

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
  const txData = parseTxDetails(data);

  const currentContract = data["in_msg"]["destination"];

  return (
    <div class={tw`p-4 mx-auto max-w-screen-md `}>
      <p
        class={tw`my-2  m-4 font-medium flex opacity-90 hover:opacity-100 hover:underline`}
      >
        <Avatar address={currentContract} size={100}></Avatar>
        <a
          style={`line-height:100px; font-size:1rem `}
          href={`/address/${currentContract}`}
        >
          {currentContract}
        </a>
      </p>
      <p class={tw`my-2 text-6xl m-4 font-light`}>Transaction</p>
      <div
        class={tw`grid grid-cols-4 gap-4 content-start bg-white  dark:bg-gray-800 dark:border-gray-700`}
      >
      </div>
      {Tx(data, txData)}

      <TopHeader />
      <Footer />
    </div>
  );
}

function Tx(element, txData) {
  //console.log(element);

  return (
    <div
      class={tw`bg-white  dark:bg-gray-800 dark:border-gray-700 p-2 `}
    >
      <div class={tw`border-t border-l border-r p-1`}>
        <div>
          Time: {new Date(parseInt(element["utime"]) * 1000).toISOString()}
        </div>
      </div>
      <div class={tw`grid grid-cols-4 border-t border-l border-r p-1`}>
        <div>🔄 State</div>
        <div>{txData.newStatus}</div>
      </div>
      <div class={tw`border-t border-l border-r p-1`}>
        <pre
          class={tw`overflow-scroll`}
        >{ beginCell().storeBuffer(Buffer.from(element["in_msg"]["message"], "base64")).endCell().toString()}</pre>
        <div className={tw`grid grid-cols-4 border-t border-l border-r p-1 `}>
          <div>➡️ From :</div>
          <div class={tw`col-span-3`}>{element["in_msg"]["source"]}</div>
        </div>
        <div className={tw`grid grid-cols-4 border-t border-l border-r p-1 `}>
          <div>💎 Value :</div>
          <div>{fromNano(element["in_msg"]["value"]).toString()}</div>
        </div>

        <div className={tw`grid grid-cols-4 border-t border-l border-r  `}>
          <div>⛽️ Fee:</div>
          <div>
            {fromNano(element["fee"]).toString().substring(0, 6)} 💎
          </div>
        </div>
        <div
          className={tw`grid grid-cols-4 border-t border-l border-r  border-b`}
        >
          <div>⛽️ Forward Fee:</div>
          <div>
            {fromNano(element["in_msg"]["fwd_fee"]).toString().substring(0, 6)}
            {" "}
            💎
          </div>
        </div>

        {ActionPhase(element, txData)}
        {ComputePhase(element, txData)}
        {StoragePhase(element, txData)}
        {OutMessages(element["out_msgs"], txData, element["utime"])}
      </div>
    </div>
  );
}

function OutMessages(data: Array<any>, txData, utime) {
  let list = data.map((element, i) => {
    let body = txData.outMessages[i].body;
    let action = txData.outMessages[i];

    let value = fromNano(action.info.value.coins.toString());

    return (
      <div class={tw`border-t`}>
        <div class={tw`text-4xl m-4 font-light gap-y-4`}>Action {i + 1}</div>
        <div class={tw`width-3/4`}>
          <div
            class={tw`grid border-t-1 grid-cols-4 border-b-1 border-l-1 border-r-1 p-2 `}
          >
            <div>Source</div>
            <div class={tw`col-span-3`}>{element["source"]}</div>
          </div>
          <div
            class={tw`grid grid-cols-4 border-b-1 border-l-1 border-r-1 p-2 `}
          >
            <div>Destination</div>
            <div class={tw`col-span-3`}>{element["destination"]}</div>
          </div>

          <div
            class={tw`grid grid-cols-4  border-b-1 border-l-1 border-r-1 p-2  `}
          >
            <div>Value</div>
            <div>{value.substring(0, 8)} 💎</div>
          </div>
          <div
            class={tw`grid grid-cols-4 border-b-1 border-l-1 border-r-1 p-2 `}
          >
            <div>Forward Fee</div>
            <div>{fromNano(element["fwd_fee"]).substring(0, 8)} 💎</div>
          </div>
          <div
            class={tw`grid grid-cols-4 border-b-1 border-l-1 border-r-1 p-2 `}
          >
            <div>Bounce</div>
            <div>{action.info.bounce ? "true" : "false"}</div>
          </div>
          <div
            class={tw`grid grid-cols-4 border-b-1 border-l-1 border-r-1 p-2 `}
          >
            <div>Bounced</div>
            <div>{action.info.bounced ? "true" : "false"}</div>
          </div>
          <div
            class={tw`grid grid-cols-4 border-b-1 border-l-1 border-r-1 p-2 `}
          >
            <div>Message</div>
            <div>{body.toString().substring(0, 15)}</div>
          </div>
          <div
            class={tw`grid grid-cols-4 border-b-1 border-l-1 border-r-1 p-2 `}
          >
            <div>Created</div>
            <div class={tw`col-span-3`}>
              {new Date(parseInt(utime) * 1000).toISOString()}
            </div>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div>
      <div class={tw`text-4xl m-4 font-light gap-y-4`}>
        Outgoing Messages ({txData.outMessagesCount})
      </div>
      {list}
    </div>
  );
}

function ActionPhase(data: Array<any>, txData) {
  return (
    <div>
      <p class={tw`my-2 text-2xl m-4 `}>Action Phase</p>
      <div class={tw`width-3/4`}>
        <div
          class={tw`grid border-t-1 grid-cols-4 border-b-1 border-l-1 border-r-1 p-2 `}
        >
          <div>Type</div>
          <div class={tw`col-span-3`}>{txData.description.type}</div>
        </div>
        <div
          class={tw`grid border-t-1 grid-cols-4 border-b-1 border-l-1 border-r-1 p-2 `}
        >
          <div>resultCode</div>
          <div class={tw`col-span-3`}>{txData.actionPhase}</div>
        </div>
        <div
          class={tw`grid border-t-1 grid-cols-4 border-b-1 border-l-1 border-r-1 p-2 `}
        >
          <div>Old Hash</div>
          <div class={tw`col-span-3`}>
            {txData.update.oldHash.toString("base64")}
          </div>
        </div>
        <div
          class={tw`grid border-t-1 grid-cols-4 border-b-1 border-l-1 border-r-1 p-2 `}
        >
          <div>New Hash</div>
          <div class={tw`col-span-3`}>
            {txData.update.newHash.toString("base64")}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComputePhase(data: Array<any>, txData) {
  return (
    <div>
      <p class={tw`my-2 text-2xl  m-4 `}>Compute Phase</p>
      <div class={tw`width-3/4`}>
        <div
          class={tw`grid border-t-1 grid-cols-4 border-b-1 border-l-1 border-r-1 p-2 `}
        >
          <div>Success</div>
          <div class={tw`col-span-3`}>
            {txData.description.computePhase.success}
          </div>
        </div>
        <div
          class={tw`grid border-t-1 grid-cols-4 border-b-1 border-l-1 border-r-1 p-2 `}
        >
          <div>Exit Code</div>
          <div class={tw`col-span-3`}>
            {txData.description.computePhase.exitCode}
          </div>
        </div>
        <div
          class={tw`grid border-t-1 grid-cols-4 border-b-1 border-l-1 border-r-1 p-2 `}
        >
          <div>Vm Steps</div>
          <div class={tw`col-span-3`}>
            {txData.description.computePhase.vmSteps}
          </div>
        </div>
      </div>
    </div>
  );
}

function StoragePhase(data: Array<any>, txData) {
  return (
    <div>
      <p class={tw`my-2 text-2xl m-4 `}>Storage Phase</p>
      <div class={tw`width-3/4`}>
        <div
          class={tw`grid border-t-1 grid-cols-4 border-b-1 border-l-1 border-r-1 p-2 `}
        >
          <div>Storage Fees Collected</div>
          <div class={tw`col-span-3`}>
            {fromNano(
              txData.description.storagePhase.storageFeesCollected.toString(),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
