import { Address, beginCell, Cell, fromNano, toNano } from "https://cdn.skypack.dev/ton";

function parseJettonTransfer(msg: Cell) {
    const slice = msg.beginParse();
    const op = slice.readUint(32);
    const query = slice.readUint(64);
    const amount = slice.readCoins();
    const destination = slice.readAddress();
    const response_destination = slice.readAddress();

    return {
        "#": "JettonTransfer",
        op: op.toString(16),
        query: query.toString(10),
        destination: destination?.toFriendly(),
        response_destination: response_destination?.toFriendly(),
        amount: fromNano(amount),
    };
}

function parseExcess(msg: Cell) {
    const slice = msg.beginParse();
    const op = slice.readUint(32);
    const query = slice.readUint(64);
    return {
        "#": "JettonExcess",
        op: op.toString(16),
        query: query,
    };
}

function parseJettonInternalTransfer(msg: Cell) {
    let slice = msg.beginParse();
    const op = slice.readUint(32);
    const query = slice.readUint(64);
    const amount = slice.readCoins();
    // const to = slice.readAddress();

    return {
        "#": "JettonInternalTransfer",
        op: op.toString(16),
        query: query.toString(10),
        // to: to?.toFriendly(),
        amount: fromNano(amount),
    };
}

// .store_coins(jetton_amount)
//         .store_slice(from_address)
//         .store_slice(either_forward_payload)

function parseJettonTransferNotification(msg: Cell) {
    try {
        let slice = msg.beginParse();
        const op = slice.readUint(32);
        const query = slice.readUint(64);
        const amount = slice.readCoins();
        const from = slice.readAddress();
        const subOp = slice.readUint(32);
        let slippage = 0;
        const action = subOp.toString() == "12" ? "Swap_Token" : "Add_Liquidity";
        // if(action == "Add_Liquidity") {
        //     slippage = slice.readUint(32)
        // }
        const minAmountOut = slice.readCoins();

        return {
            "#": action,
            op: op.toString(16),
            query: query.toString(10),
            from: from?.toFriendly(),
            amount: fromNano(amount),
            subOp: subOp.toString(),
            minAmountOut: minAmountOut,
            slippage: slippage.toString()
        };
    } catch (e) {
        return {
            "#": "NAx",
            op: "1",
            query: "1",
            from: "x",
            amount: "1",
            subOp: "x",
            minAmountOut: "x",
        };
    }
}

function parseBurnNotification(msg: Cell) {
    let slice = msg.beginParse();
    const op = slice.readUint(32);
    const query = slice.readUint(64);
    const amount = slice.readCoins();
    const from = slice.readAddress();
    // const subOp = slice.readUint(32);
    // const minAmountOut = slice.readCoins();

    return {
        "#": "RemoveLiquidity",
        op: op.toString(16),
        query: query.toString(10),
        from: from?.toFriendly(),
        amount: fromNano(amount),
    };
}

function parseTonSwap(msg: Cell) {
    const slice = msg.beginParse();
    const op = slice.readUint(32);
    const query = slice.readUint(64);
    const amount = slice.readCoins();
    const minAmountOut = slice.readCoins();
    // const to = slice.readAddress();

    return {
        "#": "SwapTON",
        op: op.toString(16),
        query: query.toString(10),
        amount: fromNano(amount.toString()),
        minAmountOut: fromNano(minAmountOut.toString()),
    };
}

const OP_TRANSFER_NOTIFICATION = 0x7362d09c;
const OP_INTERNAL_TRANSFER = 0x178d4519;
const OP_EXCESSES = 0xd53276db;
const OP_BURN = 0x595f07bc;
const OP_BURN_NOTIFICAITON = 0x7bdd97de;

export function parseDexBoc(boc: string, encoding: "hex" | "base64") {
    if (!boc) {
        return { body: `x{}` };
    }
    let cell;
    let op;
    try {
        cell = Cell.fromBoc(Buffer.from(boc, encoding))[0];
        op = "na";
        op = cell.beginParse().readUint(32).toString(16);
    } catch (e) {
        return { body: Buffer.from(boc, encoding).toString("hex") };
    }
    //console.log(cell);

    if (op == "19") {
        return parseTonSwap(cell);
    }

    //transfer

    if (op == "f8a7ea5") {
        let d = parseJettonTransfer(cell);
        return d;
    }

    //internal-transfer
    if (op == "d53276db") {
        return parseExcess(cell);
    }
    if (op == "178d4519") {
        return parseJettonInternalTransfer(cell);
    }

    if (op == "7362d09c") {
        return parseJettonTransferNotification(cell);
    }
    if (op == "7bdd97de") {
        return parseBurnNotification(cell);
    }
    return cell.toString().replace("\n", "").replace('"', "");
}
