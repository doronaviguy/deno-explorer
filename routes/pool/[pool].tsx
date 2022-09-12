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
  parseJettonMetadata,
  parseTxDetails,
} from "../../utils/utils.ts";

import { Avatar } from "../../components/Avatar.tsx";
import { TopHeader } from "../../components/Header.tsx";
import { ContractAddress } from "../../components/ContractAddress.tsx";
import { MessageBody } from "../../components/MessageBody.tsx";
import { Footer } from "../../components/Footer.tsx";
import { PoolMessageBody } from "../../components/PoolMessageBody.tsx";

interface AddressData {
  wallet: boolean;
  balance: any;
  account_state: string;
  wallet_type: string;
  seqno: number;
  tokenReserves: BN,
  tonReserves: BN,
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

    promises.push(callTonRPC(`
    {"id":"1","jsonrpc":"2.0","method":"runGetMethod","params":{"address":"0:0fca6dbcf53e7c3c544b3b3b63bf186eb8a5c78f63d940b9c8a92a74d7ff5234","method":"get_jetton_data","stack":[]}}
    `))

    promises.push(getWalletInfo(address));
    const responses = await Promise.all(promises);

    let res = responses[1].result;
      console.log(res);
      
    const totalSupply = hexToBn(res.stack[0][1]);
    
    const jettonWalletAddressBytes = res.stack[2][1].bytes as string;
    const tonReserves = hexToBn(res.stack[3][1]);
    const tokenReserves = hexToBn(res.stack[4][1]);
    const admin = res.stack[5][1].bytes as string;
    
    const txs = responses[0].result as Transaction[];
    const walletData = responses[2];
    //const metadata =  parseJettonMetadata(res.stack[6][1].bytes);

    const data = {
      ...walletData.result,
      tonReserves,
      tokenReserves,
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

  let list = data?.transactions.map((element) => {
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
        <div class={tw`p-2`}>
          <div
            class={tw`p-2 text-4l  `}
            title={new Date(txData.time * 1000).toISOString()}
          >
            Last Updated: <b>{renderTimeAgo(new Date(txData.time * 1000))}</b>
          </div>
          <div class={tw`p-2 text-4l  border-t `}>
            State: <b>{data.account_state}</b>
          </div>
          <div class={tw`p-2 text-4l  border-t `}>
            Ton Reserves: <b>{fromNano(data.tonReserves)} 💎</b>
          </div>
          <div class={tw`p-2 text-4l  border-t `}>
            Token Reserves: <b>{fromNano(data.tokenReserves)}</b>
          </div>
          <div class={tw`p-2 text-4l  border-t border-b `}>
            Value: <b>{fromNano(data?.balance).substring(0, 6)} 💎</b>
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

function Tx(element: any, myAddress: Address) {
  let href = `/tx/` +
    encodeURIComponent(
      `${element.in_msg.destination.toString()}|${element.transaction_id.lt}|${element.transaction_id.hash}`,
    );

  let msgValue = element["in_msg"]["value"];
  let isOutTransaction = element["in_msg"]["source"].length == 0;
  if (isOutTransaction) {
    msgValue = element["out_msgs"][0]["value"];
  }

  msgValue = fromNano(msgValue);

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
      <div style={`font-size: 60px;`} class={tw`bg-gray-100 pl-2 pr-2 pb-2 pt-2 content-center flex `}>
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
