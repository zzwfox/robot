var sys = require('./sysconfig.js').Sys;
var Stellar = require('./Stellar.js').Stellar;
var Plan = require('./transactionPlane.js').Plan;
var async = require('async');

var wallet = new Stellar(sys.url,sys.robot1.secret);
var plan = new Plan(sys.plan1.buying,sys.plan1.selling,sys.plan1.priceLine,sys.plan1.margin,sys.plan1.amount,sys.plan1.rate);
async.auto({
    loadAccount: function (callback) {
        console.log("***************load acount************");
        var loadAccount = wallet.api.loadAccount();
        wallet.doAction(loadAccount,callback);
    },
    genPlan: function (callback) {
        console.log("***************gen plan***************");
        plan.genPlan(callback);
        console.log("***************gen plan complete***************");
    },
    executePlan: ['loadAccount', 'genPlan', function(results,callback) {
            if(!sys.setOffer){
              console.log("no new offers plan for address (%s)",results.loadAccount.id); 
              callback(null);
              return;
            }
            console.log("excute plan for address (%s)",results.loadAccount.id); 
            async.eachLimit(results.genPlan, 1, function (plan, callback) {
                      console.log("excute plan (%d)",plan.price, plan.selling, plan.buying);
                        var cmd = wallet.api.manageOffer();
                        cmd.param=plan;
                        wallet.doAction(cmd,callback);
                       // callback(null);
                    }, function (err) {
                        if (err) {
                            console.error(err);
                             callback(err);
                           // mail.notifyError(err, '');
                        } else {
                            callback(null,'("***************plan done*****************');
                        }
                        
                    });
           
        }],
    listenTrade: ['loadAccount',function(results,callback){
           listenTrade(wallet,plan); 
           callback(null);
     }]
    },
    function (err, results) {
    console.log('Auto process err = ', err);
    //console.log('Auto end : ', results);
    }
);

function listenTrade(wallet,plan){

        var orderId='';
        
        var qcmd = wallet.apiQuery.OrderbookTrades();
        qcmd.param={selling:plan.selling,buying:plan.buying};
        wallet.doActionQuery(qcmd,function(err,data){
            if(data === undefined){listenTrade(wallet,plan);return;}
            async.eachLimit(data.records, 1, function (record, callback) {
               orderId = toNumber(record.id);
               //console.log("check orderid %s and walletid %d -%d",orderId,wallet.orderId,orderId-wallet.orderId);
               if(undefined===wallet.orderId){console.log("init statu return");callback(null);return;};
               console.log("check orderid %d and walletid %d Differ %d for (%s)",orderId,wallet.orderId,orderId-wallet.orderId,wallet.address);
                if(orderId>wallet.orderId){
                  console.log("got new trades  analysing****");
                  if(record.seller_attr===wallet.address){
                      console.log("new trades for (%s)",wallet.address,record);
                    plan.genPlanBuy(record,function(err,plan){
                      console.log("excute plan (%d)",plan.price, plan.selling, plan.buying);
                        var cmd = wallet.api.manageOffer();
                        cmd.param=plan;
                        wallet.doAction(cmd,callback);  
                    });

                  }else if(record.buyer_attr===wallet.address){
                     plan.genPlanSell(record,function(err,plan){
                      console.log("excute plan (%d)",plan.price, plan.selling, plan.buying);
                        var cmd = wallet.api.manageOffer();
                        cmd.param=plan;
                        wallet.doAction(cmd,callback);  
                    });  
                  }
                }else{
                    console.log("******no new trades for (%s)******return",wallet.address);
                    callback(null);
                }
             },
             function (err) {
                        if (err) {
                            console.error(err);
                           // mail.notifyError(err, '监控出错');
                        } else {
                            console.log("..../DONE check d%" +"RECHECK IN 10s.",orderId);
                            wallet.orderId=orderId;
                        }
                        setTimeout(function () {
                                listenTrade(wallet,plan);
                            }, 10* 1000);
                    });
        }); 
         

}
function toNumber(id){
   if(id.indexOf('-')!== -1){
        return Number(id.split("-")[0]);
     }else{
        return Number(id);
     } 
}




