export default class Transaction {
  constructor(
    public sender: string,
    public receiver: string,
    public amount: number,
    public timeStamp: number,
    public reward?: boolean,
    public signature?: string
    ) {}
}