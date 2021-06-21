import Block from "./block.js";
import Transaction from "./transaction.js";
import Wallet from "./wallet.js";
import crypto from "crypto";
import axios from "axios";
import { ec } from "./ec.js";

export default class Chain {
  public chain: Block[] = [];
  public nodes: string[] = [];
  public pendingTransactions: Transaction[] = [];
  #wallets: Wallet[] = [];
  public difficulty = 4;
  public reward = 10;
  constructor(){
    this.chain = [this.genesisBlock()];
  }
  genesisBlock(){
    return new Block(0,["genesis Block"],Date.now(),"0")
  }
  
  hash(data: string):string{
    return crypto.createHash("SHA256").update(data).digest("hex")
  }
  
  signWithPrivateKey(privateKey: string, dataHash: string):string{
    return ec.signHex(dataHash,privateKey)
  }
  
  verifyWithPublicKey(dataHash: string,signature: string, publicKey: string):boolean{
    return ec.verifyHex(dataHash,signature,publicKey)
  }
  
  registerNode(node: string){
        this.nodes.push(node);
    }
    
    addWallet(wallet: Wallet){
       this.#wallets.push(wallet);
    }
  
  findWallet(key: string):Wallet{
     let wallet: Wallet;
      this.#wallets.forEach(child=>{
        if(child.privateKey === key){
          wallet = child;
        }
      })
      return wallet!
    }
    
    private findWithPublic(key: string):Wallet{
      let wallet: Wallet;
      this.#wallets.forEach(child=>{
        if(child.publicKey === key){
          wallet = child;
        }
      })
      return wallet!
    }
  
  createTransaction( 
    sender: string, 
    receiver: string, 
    amount: number, 
    reward: boolean = false, 
    timeStamp: number = 
    Date.now(), 
    ): Transaction{ 
      return { 
      sender, receiver, amount, reward, timeStamp 
    } 
  }
  
  signTransaction(transaction: Transaction,privateKey:string): Transaction {
    
        const transactionHash: string = this.hash(JSON.stringify(transaction));
        const signature: string = this.signWithPrivateKey(privateKey, transactionHash);
        transaction.signature = signature;
        
        return transaction;
      }
      
      validateTransaction(transaction: Transaction): boolean {
        const { signature, ...transactionData } = transaction;
    
        const transactionHash: string = this.hash(JSON.stringify(transactionData));
    
        return this.verifyWithPublicKey(transaction.sender, transactionHash, signature!);
      }
      
      addTransaction(transaction: Transaction) {
        this.pendingTransactions.push(transaction);
      }
      
      async broadcastTransaction(transaction: Transaction) {
        for (const node of this.nodes) {
          console.log(`Sending transaction to ${ node }`);
          await axios.post(`http://localhost:3000/transactions`,{
            "data": transaction
          }).catch(err=>{
            console.log(err);
          });   
        }
        console.log(`Broadcast done\n`);
      }
      
      createBlock(
        transactions : Transaction[],
        previousHash : string,
        timestamp = Date.now(),
      ): Block {
        
        return new Block(
            this.chain.length + 1,
            transactions,
            timestamp,
            previousHash
        )
      }
      
      validateBlock(block: Block): boolean {
        let solution = 0;
        console.log('Mining...');

        while(true){
          const hash = crypto.createHash("SHA256");
          hash.update((block.nonce + solution).toString()).end();

          const attempt = hash.digest("hex");

          if(attempt.substr(0,this.difficulty)==="0".repeat(this.difficulty)){
             console.log(`Solved: ${solution}\nBlock ${block.height} Forged`);
             return true
          }
          solution++
        }
      }
      
      resolveBalance(sender: string,receiver: string, amount: number){
       let senderWallet = this.findWithPublic(sender);
       let receiverWallet = this.findWithPublic(receiver);
        senderWallet.balance -= amount;
        receiverWallet.balance += amount;
      }
      
      mine(key: string): Block {
        let wallet = this.findWallet(key);
    
        const coinbaseTransaction: Transaction = this.signTransaction(
          this.createTransaction(wallet.publicKey, wallet.publicKey, this.reward, true),key
        );
        
        const transactions: Array<Transaction> = [coinbaseTransaction, ...this.pendingTransactions];
        const lastBlock: Block = this.chain[ this.chain.length - 1 ];
        const previousHash: string = lastBlock.hash
        const block: Block = this.createBlock(transactions, previousHash, Date.now());
    
        const minedBlock: Block = this.proofOfWork(block);
    
        this.addBlock(minedBlock);
        transactions.forEach(child=>{
          this.resolveBalance(child.sender,child.receiver,child.amount);
        })
    
        return minedBlock;
      }
      
      proofOfWork(block: Block): Block {

       while(!this.validateBlock(block)){
         block.nonce++
       }
    
        return block;
      }
      
      addBlock(block: Block) {
        this.chain.push(block);
        
        this.pendingTransactions = this.pendingTransactions
          .filter(transaction => !block.data
            .map(blockTransaction => blockTransaction.signature)
            .includes(transaction.signature),
        );
      }
      
      async broadcastBlock(block: Block) {
        for (const node of this.nodes) {
          console.log(`Sending block to ${ node }`);
          await axios.post(`http://localhost:3000/blocks`, block);
        }
        console.log(`Broadcast done\n`);
      }
      
      validateChain(): boolean {
    
        for (let index = this.chain.length - 1; index > 0; index -= 1) {
          const block: Block = this.chain[index];
          const previusBlock: Block = this.chain[index - 1];
          const previusBlockHash: string = previusBlock.hash
             
          if (!(this.validateBlock(block) && (block.prevHash === previusBlockHash))) {
            return false;
          }
        }
        
        return true;
      }
}