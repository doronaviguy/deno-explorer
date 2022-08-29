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
