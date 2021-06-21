import express from "express";
import Chain from "./blockchain/chain.js";
import Wallet from "./blockchain/wallet.js";
import Block from "./blockchain/block.js";
import Transaction from "./blockchain/transaction.js";

const app = express();
const BlockChain = new Chain();

app.get("/",(req,res)=>{
  res.status(200).send("Connected");
});

app.get("/chain",(req,res)=>{
  res.status(200).send({
    chain: BlockChain.chain,
    validity: BlockChain.validateChain(),
  })
});

app.get("/nodes",(req,res)=>{
  res.status(200).send({
    nodes: BlockChain.nodes
    })
});

app.get("/wallet/new",(req,res)=>{
  const wallet = new Wallet();
  BlockChain.registerNode(wallet.publicKey);
  BlockChain.addWallet(wallet);
  res.send({
    Address: wallet.publicKey,
    Secret: wallet.privateKey,
    Balance: wallet.balance
  })
});

app.get("/wallet/old",(req,res)=>{
  const address = req.query.key;
  res.send(
    BlockChain.findWallet(address!.toString())
    )
});

app.post("/transaction/send",(req,res)=>{
  const senderkey = req.query.privateKey!.toString();
  const wallet = BlockChain.findWallet(senderkey);
  const key = wallet.publicKey;
  const receiver = req.query.receiver!.toString();
  const amount = parseInt(req.query.amount!.toString());
    const newTr = BlockChain.createTransaction(key!,receiver,amount);
    const signedTr = BlockChain.signTransaction(newTr,key);
    BlockChain.addTransaction(signedTr);
    BlockChain.broadcastTransaction(signedTr);
    res.send("Transaction created succesfully \n Waiting for confirmation");
});

app.get('/mine', (req, res) => {

    if (BlockChain.pendingTransactions.length) {
  
      console.log('Mining started...');
      const newBlock: Block = BlockChain.mine(req.query.key!.toString());
      console.log('Mining complete, new block forged\n');
  
    BlockChain.broadcastBlock(newBlock).catch(e => console.error(e.message));
  
      res.status(200).send({
        message : 'New Block Forged',
        block : newBlock,
      });
    } else {
      res.status(400).send({
        message : 'No Pending Transactions!',
      });    
    }
  });
  
  app.post('/transactions', (req, res) => {

    const recievedTransaction: Transaction = req.body;
    const isValid: boolean = BlockChain.validateTransaction(recievedTransaction);
    const isDuplicate: boolean = Boolean(BlockChain.pendingTransactions.find(
      transaction => transaction.signature === recievedTransaction.signature),
    );
  
    console.log(`Recieved transaction ${recievedTransaction.signature}`);
  
    if (isValid && !isDuplicate) {
      console.log('Transaction is valid, it will be added to the list and broadcast\n');
      
      BlockChain.addTransaction(recievedTransaction);
      BlockChain.broadcastTransaction(recievedTransaction).catch(e => console.error(e.message));
      
    } else {
      console.error('Transaction is invalid or duplicate and it will be discarded\n');
    }
  
    res.status(200).send();
  });
  
  app.post('/blocks', (req, res) => {

    const recievedBlock: Block = req.body;
    const isValid: boolean =BlockChain.validateBlock(recievedBlock);
    const isDuplicate: boolean = Boolean(BlockChain.chain.find(block => block.timeStamp === recievedBlock.timeStamp));
  
    console.log('Received new block');
  
    if (isValid && !isDuplicate) {
      console.log('Block is valid, it will be added to the chain and broadcast\n');
     BlockChain.addBlock(recievedBlock);
     BlockChain.broadcastBlock(recievedBlock).catch(e => console.error(e.message));
    } else {
      console.error('Block is invalid or duplicate and it will be discarded\n');
    }
  
    res.status(200).send();
  });

app.listen(3000,()=>console.log("Server running"));