import rsasign from "jsrsasign";
import { ec } from "./ec.js";

export default class Wallet {
  public publicKey: string;
  public privateKey: string;
  public balance = 500;
  constructor(){
    const keyPair = ec.generateKeyPairHex();
    this.privateKey = keyPair.ecprvhex;
    this.publicKey = keyPair.ecpubhex;
  }
}