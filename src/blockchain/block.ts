import Transaction from "./transaction.js";
import crypto from "crypto";

export default class Block {
  public hash = this.createHash();
  constructor(
    public height: number,
    public data: any[],
    public timeStamp: number,
    public prevHash: string,
    public nonce = Math.round(Math.random()) * 99999999
    ) {}
    createHash(){
      const hash = crypto.createHash("SHA256");
      hash.update(JSON.stringify(this));
      return hash.digest("hex");
    }
}