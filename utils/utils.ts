import { Address, Cell, parseTransaction, TonClient } from "https://cdn.skypack.dev/ton";
import { assertEquals } from "https://deno.land/std@0.153.0/testing/asserts.ts";

const RPC_URL = Deno.env.get("RPC") || `https://scalable-api.tonwhales.com/jsonRPC`;
const TON_CENTER_API = Deno.env.get("TON_CENTER_API")
const client = new TonClient({
    endpoint: RPC_URL,
});

export function parseTxDetails(data: any) {
    const currentContract = data["in_msg"]["destination"];
    let boc = Cell.fromBoc(Buffer.from(data.data, "base64"));
    const wc = Address.parse(currentContract).workchain;
    return parseTransaction(wc, boc[0].beginParse());
}

export function strToCell(b64: string) {
    if(!b64) {
        return new Cell();
    }
    
    return Cell.fromBoc(Buffer.from(b64, "base64"));
}

export async function callTonRPC(bodyJson: string) {
    const jsonResponse = await fetch(RPC_URL, {
        body: bodyJson,
        method: "post",
        headers: {
            accept: "application/json",
        },
    });

    const jsonData = await jsonResponse.json();
    return jsonData;
}

interface walletData {
    result: {
        wallet: boolean;
        balance: string;
        account_state: string;
        wallet_type: string;
        seqno: number;
    };
}

export async function getWalletInfo(wallet: Address) {
    const jsonResponse = await fetch("https://toncenter.com/api/v2/getWalletInformation?address=" + decodeURIComponent(wallet.toString()), {
        headers: {
            "X-Api-Key": TON_CENTER_API
        }
    });
    const jsonData = await jsonResponse.json();
    return jsonData as walletData;
}
