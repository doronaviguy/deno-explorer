import { BN } from "https://cdn.skypack.dev/-/bn.js@v5.2.0-RKfg8jZPSvF22WG62NtP/dist=es2019,mode=imports/optimized/bnjs.js";
import { Address, Cell, fromNano, parseTransaction, Slice, toNano, TonClient } from "https://cdn.skypack.dev/ton";
import { assertEquals } from "https://deno.land/std@0.153.0/testing/asserts.ts";
import { Sha256 } from "https://cdn.skypack.dev/@aws-crypto/sha256-js";

const RPC_URL = Deno.env.get("rpc") || `https://scalable-api.tonwhales.com/jsonRPC`;
const TON_CENTER_API = Deno.env.get("ton_center_api");
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
    if (!b64) {
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

export function hexToBn(num: string) {
    try {
        return new BN(BigInt(num).toString());
    }catch(e) {
        return new BN(0)
    }
    
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
            "X-Api-Key": "2aaf03fa2764848c89461bba015f4408207828b0e0487d68f9e35c02aaf83300",
        },
    });
    const jsonData = await jsonResponse.json();
    return jsonData as walletData;
}

export function nanoToFixed(bn: string, decimals: number) {
    const dot = bn.indexOf(".");
    return bn.slice(0, dot + decimals + 1);
}

export async function parseJettonMetadata(cellB64: string) {
    console.log(cellB64);

    let cell = Cell.fromBoc(Buffer.from(cellB64, "base64"))[0];

    // metadata is on chain

    // metadata is string
    //let uri = readString(cell);
    let metadata;
    try {
        let uri = cellToString(cell);
        //uri = "https://api.npoint.io/402e32572b294e845cde"
        if (uri.length == 2) {
            throw "onchain data";
        }
        let metadataRes = await fetch(uri.replace("ipfs://", "https://ipfs.io/ipfs/"));
        metadata = await metadataRes.json();
    } catch (e) {
        metadata = parseJettonOnchainMetadata(cell.beginParse()).metadata;
    }

    metadata.image = metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/");

    return {
        ...metadata,
    };
}

const POOL_INIT_COST = 0.15;
const SNAKE_PREFIX = 0x00;
const ONCHAIN_CONTENT_PREFIX = 0x00;
const OFFCHAIN_CONTENT_PREFIX = 0x01;

export type JettonMetaDataKeys = "name" | "description" | "image" | "symbol" | "decimals";
const sha256 = (str: string) => {
    const sha = new Sha256();
    sha.update(str);
    return Buffer.from(sha.digestSync());
};

const jettonOnChainMetadataSpec: {
    [key in JettonMetaDataKeys]: "utf8" | "ascii" | undefined;
} = {
    name: "utf8",
    description: "utf8",
    image: "ascii",
    symbol: "utf8",
    decimals: "utf8",
};

export function parseJettonOnchainMetadata(contentSlice: Slice): {
    metadata: { [s in JettonMetaDataKeys]?: string };
    isJettonDeployerFaultyOnChainData: boolean;
} {
    // Note that this relies on what is (perhaps) an internal implementation detail:
    // "ton" library dict parser converts: key (provided as buffer) => BN(base10)
    // and upon parsing, it reads it back to a BN(base10)
    // tl;dr if we want to read the map back to a JSON with string keys, we have to convert BN(10) back to hex
    const toKey = (str: string) => new BN(str, "hex").toString(10);
    const KEYLEN = 256;

    let isJettonDeployerFaultyOnChainData = false;

    const dict = contentSlice.readDict(KEYLEN, (s) => {
        let buffer = Buffer.from("");

        const sliceToVal = (s: Slice, v: Buffer) => {
            s.toCell().beginParse();
            console.log("snake prefix ", s.readUint(8).toNumber());

            if (s.readUint(8).toNumber() !== SNAKE_PREFIX) throw new Error("Only snake format is supported");

            v = Buffer.concat([v, s.readRemainingBytes()]);
            if (s.remainingRefs === 1) {
                v = sliceToVal(s.readRef(), v);
            }

            return v;
        };

        if (s.remainingRefs === 0) {
            isJettonDeployerFaultyOnChainData = true;
            return sliceToVal(s, buffer);
        }

        return sliceToVal(s.readRef(), buffer);
    });

    const res: { [s in JettonMetaDataKeys]?: string } = {};

    Object.keys(jettonOnChainMetadataSpec).forEach((k) => {
        const val = dict.get(toKey(sha256(k).toString("hex")))?.toString(jettonOnChainMetadataSpec[k as JettonMetaDataKeys]);
        if (val) res[k as JettonMetaDataKeys] = val;
    });

    return {
        metadata: res,
        isJettonDeployerFaultyOnChainData,
    };
}

export function cellToString(s: Cell) {
    let data = s.beginParse().readRemaining();
    return data.buffer.slice(0, Math.ceil(data.cursor / 8)).toString();
}
