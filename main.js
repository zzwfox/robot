/* 
 * 执行主体，根据钱包目前的订单和生成的计划进行订单操作。
 */

var StellarSdk = require('stellar-sdk');
var Sys = require('./sysconfig.js').Sys;
var Wallet = require('./stellarWallet.js').Wallet;
var async = require('async');
//log
var fs = require('fs'); 
var Console = console.Console;
var output = fs.createWriteStream('./log/stdout.log');
var errorOutput = fs.createWriteStream('./log/stderr.log');
var logger = new Console(output, errorOutput);

/*get the publickey and secret key pair 
 * 用私钥生成公钥私钥对
 * @type keypair
 */
logger.log("^^ init wallet");
Wallet.seed = Sys.robot1.secret;
Wallet.address=Sys.robot1.address;
Wallet.keypair=Wallet.getKeyPairFromSeed();

  
async.waterfall([
    function(callback){
        Wallet.loadAccount(Wallet.address,function(flag,account){
              if(flag){
              console.log("<-- loadAccount params--: \n" + Wallet.address);
              console.log(JSON.stringify(account,null,2));
               //callback(null,account); 
              } 
        })
    }
    ],
    function (err, result){
       console.log(JSON.stringify(err, null, 2));
    }
);

//@param opts {source:'钱包',Issuer:{publicKey:'',assetCode:'货币类型'},amount:'25',destination:'目标钱包',keypair:source的秘钥对}

var sendAsset  = function(account,callback){
        var opts = {
            source:account,
            Issuer:'native',
            amount:'100',
            destination:'Sys.robot2.address',
            keypair:Wallet.keypair
        }
        Wallet.sendAsset(opts,function(flag,result){
                if(flag){
                  console.log("<--  sendAsset  transaction params -- : \n"+JSON.stringify(opts, null, 2));
                  console.log(JSON.stringify(result, null, 2));
                  callback(null,result);   
                }else{
                    console.log(result);
                }
                  
        });
    }
    
    
var changeTrust  = function(account,callback){
        //{source:'钱包',Issuer:{publicKey:'',assetCode:'货币类型'},limit:'1000000',keypair:秘钥对}
        var opts = {
            source:account,
            Issuer:{publicKey:Sys.robot1.address,assetCode:Sys.cny},
            limit:'1000000',
            keypair:Wallet.keypair
        }
        Wallet.changeTrust(opts,function(flag,result){
                if(flag){
                  console.log("<--  changeTrust  transaction params -- : \n"+JSON.stringify(opts, null, 2));
                  console.log(JSON.stringify(result, null, 2));
                  callback(null,result);   
                }else{
                    console.log(result);
                }
                  
        });
    }
/*
var es = server.payments()
  .cursor('now')
  .stream({
    onmessage: function (message) {
      logger.log("<-- payments()");
      logger.log(message);
      logger.log(" -->");
    }
  })
*/
 /*
server.transactions()
    .forAccount(Wallet.address)
    .call()
    .then(function (page) {
        console.log('Page 1: ');
        console.log(page.records);
        return page.next();
    })
    .then(function (page) {
        console.log('Page 2: ');
        console.log(page.records);
    })
    .catch(function (err) {
        console.log(err);
    });
*/    
//console.log(account);
/*wallet.setAccount(mypair.publicKey,mypair.seed);
wallet.sendXLM(dest,'XLM','ab',function(err,msg){
    console.log("*******************");
    console.log("err"+err);
    console.log(msg);
    
})*/
