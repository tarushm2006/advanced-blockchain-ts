import rsasign from "jsrsasign";

export const ec = new rsasign.KJUR.crypto.ECDSA({curve:"secp128r1"});