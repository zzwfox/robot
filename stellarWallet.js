/* 
 * not used yet
 */
var StellarSdk = require('stellar-sdk');
var server = new StellarSdk.Server('https://horizon.stellar.org');
var operation =StellarSdk.Operation;
var Asset = StellarSdk.Asset;
StellarSdk.Network.usePublicNetwork();
//log
var fs = require('fs'); 
var Console = console.Console;
var output = fs.createWriteStream('./log/stdout_stellarWallet.log');
var errorOutput = fs.createWriteStream('./log/stderr_stellarWallet.log');
var logger = new Console(output, errorOutput);

var Wallet = {
    address : undefined,
    seed : undefined,
    seqNum:1,
    balances : {},
    server:server
};
Wallet.createWallet = function(){
    logger.log("<-- start createWalelt..");
    var tmp = {};
    var pair = StellarSdk.Keypair.random();
    tmp.secret = pair.secret();
    // SAV76USXIJOBMEQXPANUOQM6F5LIOTLPDIDVRJBFFE2MDJXG24TAPUU7
    tmp.address = pair.publicKey();
    logger.log("wallet created:");
    logger.log(tmp);
    logger.log("-->");
    return tmp;
}
var result={
    success:false,
    data:{}
}
/* 
 * 授权某个钱包 允许信任;
 *@user 网关钱包调用
 *@param opts {trustor:'钱包',assetCode:'货币类型',authorize:true|false,source:'本钱包'} 
 */
Wallet.allowTrust = function(opts,callout){
    var transaction = new StellarSdk.TransactionBuilder(opts.source)
          .addOperation(operation.allowTrust({
                    trustor: opts.trustor,
                    assetCode:opts.assetCode,
                    authorize:opts.authorize
                })).build();
        
    transaction.sign(Wallet.keypair);
    
    server.submitTransaction(transaction)
     .then(function(transactionResult) {
           callout(true,transactionResult);
        })
        .catch(function(err) {
          callout(false,err);
        });
}
/**
 * 添加信任线
 * @user 普通钱包调用
 * @param opts {source:'钱包',Issuer:{publicKey:'',assetCode:'货币类型'},limit:'1000000',keypair:秘钥对}
 */
Wallet.changeTrust = function(opts,callout){
    
    var asset = new StellarSdk.Asset(opts.Issuer.assetCode, opts.Issuer.publicKey)
    
    console.log("changeTrust build transaction");
    var transaction = new StellarSdk.TransactionBuilder(opts.source)
          .addOperation(operation.changeTrust({
                    asset: asset,
                    limit: opts.limit||'1000000'
                })).build();
    
    console.log("changeTrust sign transaction");
    transaction.sign(opts.keypair);
    
    console.log("changeTrust submit transaction");
    server.submitTransaction(transaction)
     .then(function(transactionResult) {
            console.log("changeTrust transaction success");
            callout(true,transactionResult.Issuer);
        }).catch(function(error) {
             console.error("changeTrust transaction error");
            callout(false,error.extras.result_codes);
          });
}
/**
 * 发送资产
 * 恒星 Issuer = 'native'
 * @user 网关钱包发送货币, 普通钱包转账
 * @param opts {source:'钱包',Issuer:{publicKey:'',assetCode:'货币类型'},amount:'25',destination:'目标钱包',keypair:source的秘钥对}
 */
Wallet.sendAsset = function(opts,callout){
    console.log("sendAsset build transaction");
    var asset = null;
    if('native' == opts.Issuer) {
        asset = Asset.native();
    }else{
         asset = new StellarSdk.Asset(opts.Issuer.assetCode, opts.Issuer.publicKey)
    }
    var transaction = new StellarSdk.TransactionBuilder(opts.source)
          .addOperation(operation.payment({
                    destination: opts.destination,
                    asset: asset,
                    amount: opts.amount||'0'
                })).build();
    
    console.log("sendAsset sign transaction");
    transaction.sign(opts.keypair);
    
    console.log("sendAsset submit transaction");
    server.submitTransaction(transaction)
     .then(function(transactionResult) {
          console.log("sendAsset transaction success");
           callout(true,transactionResult._links);
        })
        .catch(function(error) {
           console.error("sendAsset transaction error");
          callout(false,error.extras.result_codes);
        });
}
/**
 * 返回account 对象, balances
 * acount 拥有的方法incrementSequenceNumber()
 */
Wallet.loadAccount = function(address,callout) {
    var addr = address || Wallet.address;
    server.loadAccount(addr).then(function(account) {
     console.log("loadAccount  success");
      Wallet.account = account;
      callout(true,account);
    });
}
/**
 * 激活钱包
 * @balance 发送激活的 恒星数量
 */
Wallet.fundWallet = function(destAddr,balance,callout){
    // create an Account object using locally tracked sequence number
    if(balance === undefined){
        balance = "25";
    }
    var transaction = new StellarSdk.TransactionBuilder(Wallet.account)
        .addOperation(operation.createAccount({
          destination: destAddr,
          startingBalance: balance  // in XLM
        }))
        .build();

    transaction.sign(Wallet.keypair); // sign the transaction
    
     server.submitTransaction(transaction)
        .then(function(transactionResult) {
           callout(true,transactionResult._links);
        })
        .catch(function(error) {
          callout(false,error.extras.result_codes);
        });
}

Wallet.getKeyPairFromSeed = function(seed){
     seed = seed || Wallet.seed;
    var keypair = StellarSdk.Keypair.fromSecret(seed);
    return keypair;
};

Wallet.getAddressFromSeed = function(seed) {
		 seed = seed || Wallet.seed;
		var keypair = StellarSdk.Keypair.fromSecret(seed);
		return keypair.publicKey();
	};
Wallet.isValidAddress = function(address) {
		return StellarSdk.Keypair.isValidPublicKey(address);
	};

exports.Wallet = Wallet;