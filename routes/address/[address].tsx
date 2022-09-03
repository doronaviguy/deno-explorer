/** @jsx h */
import { h } from "preact";
import { Handlers, PageProps } from "$fresh/server.ts";
import { tw } from "@twind";

import {
  Address,
  beginCell,
  Cell,
  fromNano,
  parseTransaction,
} from "https://cdn.skypack.dev/ton";

import { format } from "https://cdn.skypack.dev/timeago.js";

import {
  callTonRPC,
  getWalletInfo,
  parseTxDetails,
strToCell,
} from "../../utils/utils.ts";

import { Avatar } from "../../components/Avatar.tsx"

export function addressEllipsis(address: string) {
  if (!address) {
    return `...`;
  }

  if (typeof address == "object") {
    // @ts-ignore
    address = address.toFriendly();
  }

  return <a style={`color:#4280f0; display:inline-flex; position:relative; top:6px;`} class={tw`flex opacity-90 hover:opacity-100 hover:underline `} href={`/address/${address}`}>
    <span>
    <Avatar address={address} size={25}></Avatar>

    </span>
    <span style={`padding-left:5px; `} class={tw`p-l-5`}>
    {address.substring(0, 6)}....{address.substring(42, 48)}
    </span>
    </a>;
}

interface AddressData {
  wallet: boolean;
  balance: any;
  account_state: string;
  wallet_type: string;
  seqno: number;
  transactions: Transaction[];
}

interface Transaction {
  data: string;
  date: string;
}

export const handler: Handlers<Transaction[] | null> = {
  async GET(_, ctx) {
    let address = Address.parse(ctx.params.address);
    let promises = [];

    promises.push(callTonRPC(
      `{"id":"1","jsonrpc":"2.0","method":"getTransactions","params":{"address":"${address.toString()}","limit":200}}`,
    ));

    promises.push(getWalletInfo(address));
    const responses = await Promise.all(promises);

    const txs = responses[0].result as Transaction[];
    const walletData = responses[1];
    console.log(walletData);

    const data = {
      ... walletData.result,
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
  if(data?.seqno) {
    walletSection = (<div><div class={tw`p-2 text-4l p-1 border-t `}>
    Seqno: <b>{data.seqno}</b>
  </div>
  <div class={tw`my-2 text-4l p-1 border-t border-b`}>
    Wallet Type: <b>{data.wallet_type}</b>
  </div></div>)
  }

  return (
    <div class={tw`p-4 mx-auto max-w-screen-md`}>
      <p class={tw`my-2 text-5xl font-light`}>
        Address
      </p>
      <p class={tw`my-2 text-2xl `}>
        👾 {params.address}
      </p>
      
      <div class={tw`flex`}>
        <div >
          <Avatar address={params.address} size={data.seqno ? 225 : 180}></Avatar>
        </div>
        <div class={tw`p-2`}>
        <div class={tw`p-2 text-4l  `} title={new Date(txData.time*1000).toISOString()}>
        Last Updated: <b >{renderTimeAgo(new Date(txData.time*1000))}</b>
      </div>
      <div class={tw`p-2 text-4l  border-t `}>
        State: <b>{data.account_state}</b>
      </div>
      <div class={tw`p-2 text-4l  border-t  `}>
        Value: <b>{fromNano(data.balance).substring(0,6)} 💎</b>
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
        <div class={tw`grid grid-cols-5 content-center  p-1`}>
          {/* <div>
            Since
          </div>
          <div>
            Direction
          </div>
          <div>
            Address
          </div>
          <div>
            Value
          </div>
          <div>Fee</div> */}
        </div>

        {list}
      </div>
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

  const hash = element["transaction_id"]["hash"]
  return (
    <div
      class={tw`bg-white border-t border-l border-r dark:bg-gray-800 dark:border-gray-700 m-1 `}
    >
      <a class={tw`text-cyan-500 p-b-5`} href={href}>
        <div>
        <div class={tw`opacity-70 hover:opacity-100 `} title={new Date(parseInt(element["utime"]) * 1000).toISOString()}>🔗 <span class={tw`p-1`}></span>
            {renderTimeAgo(
              new Date(parseInt(element["utime"]) * 1000).toISOString(),
            )}
            <span class={tw`p-5 text-xs`}>hash:{hash}</span>
          </div>

        </div>
        <div class={tw`grid grid-cols-1 content-center  p-1`}>
          <div class={tw`text-align-center`}>
          {msgValue.toString().substring(
              0,
              6,
            )}💎
              <span class={tw`p-5`}> </span>
              {isOutTransaction
              ? <span class={tw`p-1 text-2m`}>External Message</span>
              : <span class={tw``}>From</span>}
              <span class={tw`p-5`}></span>
              {addressEllipsis(element["in_msg"]["source"] || myAddress)}    
              <span class={tw`p-5`}></span>
              ( fee:{fromNano(element["fee"]).toString().substring(0, 6)} 💎 )
          </div>
        </div>
        <div class={tw`bg-gray-100 p-1 content-center  `}>
            <pre class={tw`overflow-scroll max-h-20 `} style={`color:#506f9c`}>{strToCell(element["in_msg"]["msg_data"]["body"]).toString()}</pre>
          
        </div>
      </a>
      {Actions(element["out_msgs"])}
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
    if(body) {
       cell = beginCell().storeBuffer(Buffer.from(body, "base64")).endCell();
    }

    return (
      <div>
        <div class={tw`grid grid-cols-4 grid-gap-4 content-center bg-gray-200 p-1 border-t`}>
          
            <div class={tw`p-l-5`}>Actions:</div>
            <div class={tw`col-span-3`}>
              <span style={``}>
              🎬 {fromNano(element["value"]).substring(0,6)}💎 
              </span>
              <span class={tw`p-2`}></span> 
              {addressEllipsis(element["destination"])}
            </div>
            
          
        </div>
      </div>
    );
  });

  return list;
}
