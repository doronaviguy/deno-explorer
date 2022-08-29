const TonWeb = require("tonweb");
const { Cell, Address, fromNano, parseTransaction } = require("ton");

import axios from "axios";

/*
const storage = require('node-persist');
 
//you must first call storage.init

await storage.setItem('name','yourname')
console.log(await storage.getItem('name')); // yourname
*/

const opid2str: Record<string, string> = {
    f8a7ea5: "Jetton::Transfer",
    "7362d09c": "Jetton::Transfer_Notification",
    d53276db: "Jetton:Exccess",
    "595f07bc": "Jetton::Burn",
    "178d4519": "Jetton:Internal_Transfer",
    "7bdd97de": "Jetton:Burn_Notification",
    "15": "Jetton:Jetton::Mint",
    "5fcc3d14": "NFT::Transfer",
    "2fcb26a2": "NFT::GetData",
    "1": "Wallet::install_plugin",
    "2": "Wallet::Uninstall_plugin",
};

function fopid2str(op: string) {
    return opid2str[op] ? opid2str[op] + "(" + op + ")" : op;
}

function sendToKibana(oo: any) {
    axios.get("http://logs.orbs.network:3001/putes/tonscan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(oo),
    });
}

async function init() {
    try {
        const provider = new TonWeb.HttpProvider(
            //'https://scalable-api.tonwhales.com/jsonRPC'
            "https://toncenter.com/api/v2/jsonRPC",
            { apiKey: "2aaf03fa2764848c89461bba015f4408207828b0e0487d68f9e35c02aaf83300" }
        );

        const tonweb = new TonWeb(provider);

        const storage = new TonWeb.InMemoryBlockStorage(); //console.log);

        const onBlock = async (blockHeader: any) => {
            const workchain = blockHeader.id.workchain;

            if (workchain == -1) return;

            const shardId = blockHeader.id.shard;
            const blockNumber = blockHeader.id.seqno;

            //console.log('BLOCK ', blockHeader);

            const blockTransactions = await tonweb.provider.getBlockTransactions(workchain, shardId, blockNumber); // todo: (tolya-yanot) `incomplete` is not handled in response
            const shortTransactions = blockTransactions.transactions;
            for (const shortTx of shortTransactions) {
                const address = shortTx.account;

                const txs = await tonweb.provider.getTransactions(address, 1, shortTx.lt, shortTx.hash);
                const tx = txs[0];

                let c = null,
                    opid = "",
                    q_id = "";
                var aborted: boolean = false,
                    success = false,
                    bounce = false,
                    bounced = false;
                var exitcode = -1;

                let x = tx.in_msg?.msg_data?.body;
                if (x) {
                    try {
                        c = Cell.fromBoc(Buffer.from(x, "base64"));
                        opid = c[0].beginParse().readUint(32).toString(16);

                        opid = fopid2str(opid);
                        //q_id = c[0].beginParse().readUint(32).readUint(64).toString(16);
                        let data = parseTransaction(0, Cell.fromBoc(Buffer.from(tx.data, "base64"))[0].beginParse());

                        aborted = data.description.aborted;

                        success = data.description.computePhase.success;
                        exitcode = data.description.computePhase.exitCode;
                        bounce = data.inMessage.info.bounce || false;
                        bounced = data.inMessage.info.bounced || false;
                    } catch (o) {
                        opid = "n/a";
                    }
                }

                var summery = {
                    wc: workchain,
                    shardId: shardId,
                    blockNumber: blockNumber,
                    block_time: blockHeader.end_lt,
                    unix_time: tx.utime,
                    account_orig: shortTx.account,
                    acount: Address.parse(shortTx.account).toFriendly(),
                    tx_type: tx["@type"],
                    destination: tx.in_msg ? tx.in_msg.destination : "-",
                    source: tx.in_msg ? tx.in_msg.source : "-",
                    message: tx.in_msg ? tx.in_msg.message : "-",
                    value: fromNano(tx.in_msg ? tx.in_msg.value : 0),
                    fee: fromNano(tx.fee),
                    opid: opid,
                    query_id: q_id,
                    aborted: aborted,
                    success: success,
                    exitcode: exitcode,
                    bounce: bounce,
                    bounced: bounced,
                };

                sendToKibana(summery);
                console.log("TX at ", summery);
            }
        };

        const blockSubscribe = new TonWeb.BlockSubscription(provider, storage, onBlock); //,{"startMcBlockNumber":-1});
        await blockSubscribe.start();
    } catch (o) {
        console.log("err:", o);
    }
}

init();
console.log("done");
