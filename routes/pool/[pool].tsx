/** @jsx h */
import { h } from "preact";
import { Handlers, PageProps } from "$fresh/server.ts";
import { tw } from "@twind";

import {
  Address,
  beginCell,
  Cell,
  fromNano,
  toNano,
} from "https://cdn.skypack.dev/ton";

import { format } from "https://cdn.skypack.dev/timeago.js";

import {
  callTonRPC,
  getWalletInfo,
  hexToBn,
  nanoToFixed,
  parseJettonMetadata,
  parseTxDetails,
} from "../../utils/utils.ts";

import { Avatar } from "../../components/Avatar.tsx";
import { TopHeader } from "../../components/Header.tsx";
import { ContractAddress } from "../../components/ContractAddress.tsx";
import { MessageBody } from "../../components/MessageBody.tsx";
import { Footer } from "../../components/Footer.tsx";
import { PoolMessageBody } from "../../components/PoolMessageBody.tsx";
import { BN } from "https://cdn.skypack.dev/-/bn.js@v5.2.0-RKfg8jZPSvF22WG62NtP/dist=es2019,mode=imports/optimized/bnjs.js";
import { parseDexBoc } from "../../utils/message-parser.ts";

interface AddressData {
  wallet: boolean;
  balance: any;
  account_state: string;
  wallet_type: string;
  seqno: number;
  tokenReserves: BN;
  tonReserves: BN;
  transactions: Transaction[];
}

interface Transaction {
  data: string;
  date: string;
}

export const handler: Handlers<Transaction[] | null> = {
  async GET(_, ctx) {
    const address = Address.parse(ctx.params.pool);
    const promises = [];

    promises.push(callTonRPC(
      `{"id":"1","jsonrpc":"2.0","method":"getTransactions","params":{"address":"${address.toString()}","limit":200}}`,
    ));
    // handle old pool
    const poolApi =
      ctx.params.pool == "EQB3jfFvpzv8ZC0CjFgxX4-d1XsoZaVJ3mlfp8EfFdrpqqzt"
        ? "get_jetton_data"
        : "get_pool_data";

    promises.push(callTonRPC(`
    {"id":"1","jsonrpc":"2.0","method":"runGetMethod","params":{"address":"${address.toString()}","method":"${poolApi}","stack":[]}}
    `));

    promises.push(getWalletInfo(address));

    promises.push(callTonRPC(`
    {"id":"1","jsonrpc":"2.0","method":"getAddressInformation","params":{"address":"${address.toString()}","stack":[]}}
    `));

    const responses = await Promise.all(promises);

    let res = responses[1].result;

    const totalSupply = hexToBn(res.stack[0][1]);

    const jettonWalletAddressBytes = res.stack[2][1].bytes as Buffer;
    console.log(
      "jettonWalletAddressBytes",
      jettonWalletAddressBytes.toString("base64"),
    );

    const tonReserves = hexToBn(res.stack[3][1]);
    const tokenReserves = hexToBn(res.stack[4][1]);
    const admin = res.stack[5][1].bytes as string;

    const txs = responses[0].result as Transaction[];
    const walletData = responses[2];
    console.log(responses[3].result.code);

    const codeHash = Cell.fromBoc(
      Buffer.from(responses[3].result.code, "base64"),
    )[0].hash();
    console.log(codeHash);

    //const metadata =  parseJettonMetadata(res.stack[6][1].bytes);

    const data = {
      ...walletData.result,
      tonReserves,
      tokenReserves,
      codeHash: codeHash.toString("base64"),
      transactions: txs,
    } as AddressData;
    return ctx.render(data);
  },
};

export default function Transactions(
  { data, params }: PageProps<AddressData | null>,
) {
  //console.log(data);

  // take last tx to get latest
  const txData = parseTxDetails(data?.transactions[0]);

  let tonVol = new BN(0);
  let soldTon = new BN(0);
  let soldToken = new BN(0);
  let addLiquidityVolume = new BN(0);
  let removeLiquidityVolume = new BN(0);

  let list = data?.transactions.map((element) => {
    //@ts-ignore
    let messageData = parseDexBoc(
      element["in_msg"]["msg_data"]["body"],
      "base64",
    );
    let msgValueIn = extractMessageValue(element);
    let msgValueOut = extractMessageValueOut(element);

    // exclude liquidity operations form volume
    if (
      messageData["#"] == "Add_Liquidity" ||
      messageData["#"] == "RemoveLiquidity"
    ) {
      if (messageData["#"] == "Add_Liquidity") {
        addLiquidityVolume = addLiquidityVolume.add(msgValueIn);
      }

      if (messageData["#"] == "RemoveLiquidity") {
        removeLiquidityVolume = removeLiquidityVolume.add(msgValueOut);
      }
      msgValueIn = new BN(0);
      msgValueOut = new BN(0);
    }

    if (messageData["#"] == "SwapTON") {
      soldTon = soldTon.add(msgValueIn);
    }

    if (messageData["#"] == "Swap_Token") {
      //  console.log("minAmountOut", messageData.amount);

      soldToken = soldToken.add(toNano(messageData.amount));
    }

    tonVol = tonVol.add(msgValueIn).add(msgValueOut);
    return <div>{Tx(element, params.address)}</div>;
  });

  let walletSection;
  if (data?.seqno) {
    walletSection = (
      <div>
        <div class={tw`p-2 text-4l p-1 border-t `}>
          Seqno: <b>{data.seqno}</b>
        </div>
        <div class={tw`my-2 text-4l p-1 border-t border-b`}>
          Wallet Type: <b>{data.wallet_type}</b>
        </div>
      </div>
    );
  }
  console.log({
    tonReserves: data?.tonReserves.toString(),
    tokenReserves: data?.tokenReserves.toString(),
  });
  let price = new BN(0);
  try {
    price = nanoToFixed(
      fromNano(
        data?.tokenReserves.mul(new BN(1e9)).div(data?.tonReserves),
      ),
      2,
    );
  } catch (e) {
    console.log("bad price");
  }
  console.log({ price: price.toString() });
  return (
    <div class={tw`p-5 mx-auto max-w-screen-md`}>
      <p class={tw`my-2 p-5 text-5xl font-light`}>
        Pool
      </p>
      <p class={tw`my-2 text-2xl `}>
        {params.pool}
      </p>

      <div class={tw`flex`}>
        <div>
          <Avatar address={params.address} size={data.seqno ? 225 : 180}>
          </Avatar>
        </div>
        <div class={tw`p-2 w-1/2`}>
          <div
            class={tw`p-2 text-4l  `}
            title={new Date(txData.time * 1000).toISOString()}
          >
            Last Updated: <b>{renderTimeAgo(new Date(txData.time * 1000))}</b>
          </div>
          <div class={tw`p-2 text-4l  border-t `}>
            <div>
              State: <b>{data.account_state}</b> | code hash:{" "}
              <pre>{data.codeHash}</pre>
            </div>
          </div>

          <div class={tw`p-2 text-4l  border-t  flex `}>
            <div class={tw`w-1/2`}>
              Price :
            </div>
            <b>{`${price} 🪙 = 1💎`}</b>
          </div>
          <div class={tw`p-2 text-4l  border-t  flex border-b `}>
            <div class={tw`w-1/2`}>
              Value:
            </div>
            <b>{nanoToFixed(fromNano(data?.balance), 2)} 💎</b>
          </div>
          <div class={tw`p-2 text-4l  border-t `}>
            <b>Volume</b>
          </div>
          <div class={tw`p-2 text-4l  border-t  flex `}>
            <div class={tw`w-1/2`}>
              Liquidity Added
            </div>
            <b>{nanoToFixed(fromNano(addLiquidityVolume), 2)} 💎</b>
          </div>
          <div class={tw`p-2 text-4l  border-t  flex `}>
            <div class={tw`w-1/2`}>
              Liquidity Removed
            </div>
            <b>{nanoToFixed(fromNano(removeLiquidityVolume), 2)} 💎</b>
          </div>
          <div class={tw`p-2 text-4l  border-t  flex `}>
            <div class={tw`w-1/2`}>
              Swaps:
            </div>
            <b>{nanoToFixed(fromNano(tonVol), 2)} 💎</b>
          </div>
          <div class={tw`p-2 text-4l  border-t  flex `}>
            <div class={tw`w-1/2`}>
              Sold Ton:
            </div>
            <b>{nanoToFixed(fromNano(soldTon), 2)} 💎</b>
          </div>
          <div class={tw`p-2 text-4l  border-t  flex `}>
            <div class={tw`w-1/2`}>
              Sold Token:
            </div>
            <b>{nanoToFixed(fromNano(soldToken), 2)} 🪙</b>
          </div>
          <div class={tw`p-2 text-4l  border-t `}>
            <b>Pool Reserves</b>
          </div>
          <div class={tw`p-2 text-4l flex `}>
            <div class={tw`w-1/2`}>
              Ton:
            </div>
            <b>{nanoToFixed(fromNano(data.tonReserves), 2)} 💎</b>
          </div>
          <div class={tw`p-2 text-4l  border-t  flex `}>
            <div class={tw`w-1/2`}>
              Token:
            </div>
            <b>{nanoToFixed(fromNano(data.tokenReserves), 2)} 🪙</b>
          </div>
          {walletSection}
        </div>
      </div>

      <p class={tw`p-2 text-5xl font-light`}>
        Transactions
      </p>
      <div
        class={tw`bg-white  dark:bg-gray-800 dark:border-gray-700 p-1 `}
      >
        {list}
      </div>
      <TopHeader />
      <Footer />
    </div>
  );
}

function extractMessageValue(element: any) {
  let msgValue = element["in_msg"]["value"];
  if (element["in_msg"]["source"].length == 0) {
    msgValue = element["out_msgs"][0]["value"];
  }
  return new BN(msgValue);
}

function extractMessageValueOut(element: any) {
  let msgValue1 = extractValueFromMessage(element["out_msgs"][0]);
  let msgValue2 = extractValueFromMessage(element["out_msgs"][1]);
  return msgValue1.add(msgValue2);
}

function extractValueFromMessage(message: any) {
  try {
    return new BN(message["value"]);
  } catch (e) {
    return new BN(0);
  }
}

function Tx(element: any, filter: string) {
  let href = `/tx/` +
    encodeURIComponent(
      `${element.in_msg.destination.toString()}|${element.transaction_id.lt}|${element.transaction_id.hash}`,
    );

  let isOutTransaction = element["in_msg"]["source"].length == 0;

  const msgValue = fromNano(extractMessageValue(element));

  const hash = element["transaction_id"]["hash"];
  return (
    <div
      class={tw`bg-white border-t border-l border-r dark:bg-gray-800 dark:border-gray-700 mt-2 m-1 mt-4 `}
    >
      <a class={tw`text-cyan-500 p-b-5`} href={href}>
        <div>
          <div
            class={tw`opacity-70 hover:opacity-100 p-1 flex`}
            title={new Date(parseInt(element["utime"]) * 1000).toISOString()}
          >
            🔗 <span class={tw`p-1`}></span>
            {renderTimeAgo(
              new Date(parseInt(element["utime"]) * 1000).toISOString(),
            )}
            <span class={tw`ml-10 text-xs basis-1/4 p-1`}>hash:{hash}</span>
          </div>
        </div>
        <div class={tw`grid grid-cols-1 content-center  p-1`}>
          <div class={tw`text-align-center`}>
            {msgValue.toString().substring(
              0,
              6,
            )}💎
            <span class={tw`p-5`}></span>
            {isOutTransaction
              ? (
                <span class={tw`p-1 text-2m`} title={`External message`}>
                  ♾
                </span>
              )
              : <span class={tw``}>From</span>}
            <span class={tw`p-5`}></span>
            {ContractAddress(element["in_msg"]["source"])}
            <span class={tw`p-10`} style={`color:#ccc`}></span>
            fee:{fromNano(element["fee"]).toString().substring(0, 6)} 💎
          </div>
        </div>
      </a>
      {Actions(element["out_msgs"])}
      <div
        style={`font-size: 60px;`}
        class={tw`bg-gray-100 pl-2 pr-2 pb-2 pt-2 content-center flex `}
      >
        ✉️
        <pre
          class={tw`max-h-30 text-xs  ml-5`}
          style={`color:#506f9c`}
        >{PoolMessageBody(element["in_msg"]["msg_data"]["body"])}</pre>
      </div>
    </div>
  );
}

function renderTimeAgo(d: Date) {
  return format(d);
}

function Actions(data: Array<any>) {
  let list = data.map((element) => {
    let body = element["msg_data"]["body"];

    let cell = new Cell();
    if (body) {
      cell = beginCell().storeBuffer(Buffer.from(body, "base64")).endCell();
    }

    return (
      <div>
        <div
          class={tw`grid grid-cols-6  content-center bg-gray-100 p-1`}
        >
          <div class={tw`pl-5 pt-1`}></div>
          <div></div>
          <div></div>
          <div class={tw`col-span-3`}>
            <span style={``}>
              🎬 -> {fromNano(element["value"]).substring(0, 6)}💎
            </span>
            <span class={tw`p-2`}></span>
            {ContractAddress(element["destination"])}
          </div>
        </div>
      </div>
    );
  });

  return list;
}
