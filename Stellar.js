var StellarSdk = require('stellar-sdk');
var clone = require('lodash').clone;
var Sys = require('./sysconfig.js').Sys;
//var server = new StellarSdk.Server('https://horizon.stellar.org');
var Memo = StellarSdk.Memo;
function Stellar(serverUrl,walletSecret){
    var me = this;
    
    StellarSdk.Network.usePublicNetwork();
    this.server = new StellarSdk.Server(serverUrl);
    this.keyPair = StellarSdk.Keypair.fromSecret(walletSecret);
    this.address = this.keyPair.publicKey();
    this.seqNum = 0;
    this.balances = {};
    this.account = {};
    this.nativeAsset = StellarSdk.Asset.native();
    this.operation =StellarSdk.Operation;
    /**
     Stellar接口列表 返回该接口需要的参数对象, null的参数不是必填
     通过方法doAction()传入参数对象执行账户事务接口.
     通过方法doQuery()传入参数对象执行账本查询.
    */
    this.api = {
                loadAccount:function(){
                    var obj = {code:0,desc:'load acount info, return account',param:{publicKey:null}};
                    return clone(obj);
                },
                createWallet:function(){
                    var obj = {code:1,desc:'create wallet key pair',  param:null};
                    return clone(obj);
                },
                fundWallet:function(){
                    var obj = {code:2,desc:'fund an new wallet, active it on stellar network',param:{address:'',balance:'50',account:null,keyPair:null}};
                    return clone(obj);
                },
                changeTrust:function(){
                    var obj = {code:3,desc:'trust to asset of Issuer',param:{sourceAccount:null,Issuer:{publicKey:'',assetCode:''},limit:'1000000',keypair:null}};
                    return clone(obj);
                },
                sendAsset:function(){
                    var obj = {code:4,desc:'send asset to other account, for XLM  Issuer=native',
                         param:{
                            sourceAccount:null,Issuer:{publicKey:'',assetCode:''},amount:'25',destination:'',keypair:null,
                            memo:Memo.none
                          }
                         };
                    return clone(obj);
                },
                manageOffer:function(){
                    var obj = {code:5,desc:'creates, updates, or deletes an offer, offerId=0:create; amount=0:delete;price:selling / buying',
                         param:{
                            sourceAccount:null,selling:{publicKey:'',assetCode:''},buying:{publicKey:'',assetCode:''}
                            ,amount:'0',price:'number',offerId:'0',keypair:null,memo:Memo.none
                          }
                         };
                    return clone(obj);
                }
            };
    this.apiQuery = {
         offers:function(){
            var obj = {code:100,desc:'all the offers a particular account makes', param:{publicKey:''}};
            return clone(obj); 
         },
         listenOrderbook:function(){
            var obj = {code:101,desc:'the the order book *** ', param:{selling:{publicKey:'',assetCode:''},buying:{publicKey:'',assetCode:''}}};
            return clone(obj); 
         },
         OrderbookTrades:function(){
            var obj = {code:102,desc:'listen the order book trade*** ', param:{selling:{publicKey:'',assetCode:''},buying:{publicKey:'',assetCode:''}}};
            return clone(obj); 
         }
    };
};
Stellar.prototype.doAction = function(obj,callback){
        var me = this;
        switch(obj.code)
        {
            case 0:
              me.log(obj);me.loadAccount(obj.param,callback);break;
            case 1:
              me.log(obj);me.createWallet(obj.param,callback);break;
            case 2:
              me.log(obj);me.fundWallet(obj.param,callback);break;
            case 3:
              me.log(obj);me.changeTrust(obj.param,callback);break;
            case 4:
              me.log(obj);me.sendAsset(obj.param,callback);break;
            case 5:
              me.log(obj);me.manageOffer(obj.param,callback);break;
            default:
              console.log("no action");
         }
    };
Stellar.prototype.doActionQuery = function(obj,callback){
        var me = this;
        switch(obj.code)
        {
            case 100:
              me.log(obj);me.offers(obj.param,callback);break;
            case 101:
              me.log(obj);me.listenOrderbook(obj.param,callback);break;
             case 102:
              me.log(obj);me.OrderbookTrades(obj.param,callback);break;
            default:
              console.log("no action");
         }
    };

Stellar.prototype.clone = function(obj) {
    return clone(obj);
};
Stellar.prototype.getKeyPairFromSeed = function(seed){
    var keypair = StellarSdk.Keypair.fromSecret(seed);
    return keypair;
};
Stellar.prototype.log = function(obj) {
    console.log("cmd:"+obj.desc);
    console.log("param:\n"+JSON.stringify(obj.param,null,2));
};
Stellar.prototype.isValidAddress = function(address) {
		return StellarSdk.Keypair.isValidPublicKey(address);
	};
/**
 * Stellar.prototype.xxx = function(param,callback){var me = this;}
 */
Stellar.prototype.createWallet = function(param,callback){
    console.log("createWalelt..");
    var tmp = {};
    var pair = StellarSdk.Keypair.random();
    tmp.secret = pair.secret();
    // SAV76USXIJOBMEQXPANUOQM6F5LIOTLPDIDVRJBFFE2MDJXG24TAPUU7
    tmp.address = pair.publicKey();
    callback(null,tmp);
};
Stellar.prototype.loadAccount = function(param,callback) {
    var me = this;
    me.server.loadAccount(param.publicKey||me.address).then(function(account) {
      console.log("loadAccount  success: ");
      me.account = account;
      me.seqNum = account.sequence;
      me.balances = account.balances;
      callback(null,account);
    });
};
Stellar.prototype.txHandler = function (txResponse) {
    //console.log( JSON.stringify(StellarSdk.xdr.TransactionEnvelope.fromXDR(txResponse.envelope_xdr, 'base64')) );
    console.log( JSON.stringify(StellarSdk.xdr.TransactionResult.fromXDR(txResponse.result_xdr, 'base64')) );
   // console.log( JSON.stringify(StellarSdk.xdr.TransactionMeta.fromXDR(txResponse.result_meta_xdr, 'base64')) );
};
Stellar.prototype.fundWallet = function(param,callback){
    var me = this;
    var transaction = new StellarSdk.TransactionBuilder(param.account||me.account)
        .addOperation(me.operation.createAccount({
          destination: param.address,
          startingBalance: param.balance  // in XLM
        }))
        .build();

     transaction.sign(param.keyPair||me.keyPair); // sign the transaction
    
     me.server.submitTransaction(transaction)
        .then(function(transactionResult) {
           callback(null,transactionResult._links);
        })
        .catch(function(error) {
             callback(error.extras.result_codes,null);
        });
};
Stellar.prototype.changeTrust = function(param,callback){
    var me = this;
    var asset = new StellarSdk.Asset(param.Issuer.assetCode, param.Issuer.publicKey);
    var transaction = new StellarSdk.TransactionBuilder(param.sourceAccount || me.account)
          .addOperation(me.operation.changeTrust({
                    asset: asset,
                    limit: param.limit||'1000000'
                })).build();
    transaction.sign(param.keyPair||this.keyPair);
    me.server.submitTransaction(transaction)
     .then(function(transactionResult) {
            console.log("changeTrust transaction success");
            callback(null,transactionResult);
    }).catch(function(error) {
        console.error("changeTrust transaction error");
        callback(error.extras.result_codes,null);
     });
};
Stellar.prototype.sendAsset = function(param,callback){
    var me = this;
   var asset = null;
    if('native' === param.Issuer) {
        asset = me.nativeAsset;
    }else{
         asset = new StellarSdk.Asset(param.Issuer.assetCode, param.Issuer.publicKey);
    }
     var transaction = new StellarSdk.TransactionBuilder(param.sourceAccount || me.account,{memo:param.memo})
          .addOperation(me.operation.payment({
                    destination: param.destination,
                    asset: asset,
                    amount: param.amount||'0'
                })).build();
    
    transaction.sign(param.keyPair||me.keyPair);
    me.server.submitTransaction(transaction)
     .then(function(transactionResult) {
           console.log("sendAsset transaction success");
           callback(null,transactionResult);
        })
        .catch(function(error) {
            console.error("sendAsset transaction error");
            callback(error.extras.result_codes,null);
        });
};
Stellar.prototype.orderBook = function(param,callback){
    var me = this;
    me.server.orderbook(me.nativeAsset, new StellarSdk.Asset('CNY', 'GBAUUA74H4XOQYRSOW2RZUA4QL5PB37U3JS5NE3RTB2ELJVMIF5RLMAG'))
      .call()
      .then(function(resp) { callback(null,resp);})
      .catch(function(error) {callback(error.extras.result_codes,null);});
};
//   sourceAccount:null,selling:{publicKey:'',assetCode:''},buying:{publicKey:'',assetCode:''},amount:'25',price:'',keypair:null,memo:Memo.none
Stellar.prototype.manageOffer = function(param,callback){
    var me = this;
    if('0' === param.amount && '0' === param.offerId) {
        callback('the param.amoun or param.offerId is not valid',null);
    }
    if(String.valueOf(param.price).length > 15){
       callback('the param.price  more than 15 significant digits',null); 
    }
    var SellingAsset = null;
    var BuyingAsset = null;
    if('native' === param.selling) {
        SellingAsset = me.nativeAsset;
    }else{
        SellingAsset = new StellarSdk.Asset(param.selling.assetCode, param.selling.publicKey);  
    }
    if('native' === param.buying) {
        BuyingAsset = me.nativeAsset;
    }else{
        BuyingAsset = new StellarSdk.Asset(param.buying.assetCode, param.buying.publicKey);
    }
    var transaction = new StellarSdk.TransactionBuilder(param.sourceAccount || me.account,{memo:param.memo})
          .addOperation(me.operation.manageOffer({
                    selling: SellingAsset,
                    buying: BuyingAsset,
                    amount: param.amount||'0',
                    price:param.price,
                    offerId:param.offerId
                })).build();
    
    transaction.sign(param.keyPair||me.keyPair);
    me.server.submitTransaction(transaction)
     .then(function(transactionResult) {
            if(param.amount==='0'){
                console.log("delete offer:" + param.offerId);
             }else if(param.offerId==='0'){
                 console.log("create offer success");
             }else{
                 console.log("update offer success");
             }
            
           callback(null,transactionResult);
        })
        .catch(function(error) {
            console.error("offer transaction error");
            callback(error,null);
        });
};
//**********************//
Stellar.prototype.offers = function(param,callback){
    var me = this;
    me.server.offers('accounts', param.publicKey)
      .call()
      .then(function (offerResult) {
        callback(null,offerResult);
      })
      .catch(function (error) {
          callback(error.extras.result_codes,null);
      });
};
//test
var url = 'https://horizon.stellar.org';
var secret = Sys.robot1.secret;
var stellar = new Stellar(url,secret);
Stellar.prototype.listenOrderbook = function(param,callback){
    var me = this;
    var SellingAsset = null;
    var BuyingAsset = null;
    if('native' === param.selling) {
        SellingAsset = me.nativeAsset;
    }else{
        SellingAsset = new StellarSdk.Asset(param.selling.assetCode, param.selling.publicKey);  
    }
    if('native' === param.buying) {
        BuyingAsset = me.nativeAsset;
    }else{
        BuyingAsset = new StellarSdk.Asset(param.buying.assetCode, param.buying.publicKey);
    }
    var es = me.server.orderbook(SellingAsset,BuyingAsset)
    .cursor('now')
    .stream({
      onmessage: function (message) {
        callback(null,message);
      }
    })
}
Stellar.prototype.OrderbookTrades = function(param,callback){
    var me = this;
    var SellingAsset = null;
    var BuyingAsset = null;
    if('native' === param.selling) {
        SellingAsset = me.nativeAsset;
    }else{
        SellingAsset = new StellarSdk.Asset(param.selling.assetCode, param.selling.publicKey);  
    }
    if('native' === param.buying) {
        BuyingAsset = me.nativeAsset;
    }else{
        BuyingAsset = new StellarSdk.Asset(param.buying.assetCode, param.buying.publicKey);
    }
    /*me.server.orderbook(SellingAsset,BuyingAsset).trades()
    .cursor('now')
    .stream({
      onmessage: function (message) {
        callback(null,message);
      }
    });*/
    me.server.orderbook(SellingAsset,BuyingAsset).trades()
    .call()
    .then(function(resp) { callback(null,resp);})
    .catch(function(error) { callback(error)});
};
var test1 = false,test2=false,test3=false;
if(test1){
   var lcmd = stellar.api.loadAccount();
    stellar.doAction(lcmd,function(a,b){
        var cmd = stellar.api.manageOffer();
        cmd.param.selling={
            publicKey:Sys.robot1.address,
            assetCode:'CNY'
        };
        cmd.param.buying='native';
        cmd.param.amount = '100';
        cmd.param.price = 56.555555555555;
        //cmd.param.offerId
        cmd.param.memo = Memo.text("buy xlm selling cny");
        stellar.doAction(cmd,function(a,b){
            console.log(a);
           //stellar.txHandler(b);
           console.log(b);
        });
    
    });
}
if(test2){
  var qcmd = stellar.apiQuery.offers();
    qcmd.param.publicKey=Sys.robot2.address;
    stellar.doActionQuery(qcmd,function(a,b){
         console.log(a);
          console.log(JSON.stringify(b, null, 2));
    });  
}
if(test3){
    var qcmd = stellar.apiQuery.OrderbookTrades();
    qcmd.param={selling:'native',buying:{publicKey:Sys.robot1.address,assetCode:Sys.cny}};
    stellar.doActionQuery(qcmd,function(a,b){
         console.log(a);
         console.log(JSON.stringify(b, null, 2));
    }); 
    
}
exports.Stellar = Stellar;




