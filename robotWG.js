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
    },
    executePlan: ['loadAccount', 'genPlan', function(results,callback) {
            console.log("excute plan for address (%s)",results.loadAccount.id); 
            async.eachLimit(results.genPlan, 1, function (plan, callback) {
                      console.log("excute plan (%d)",plan.price, plan.selling, plan.buying);
                        var cmd = wallet.api.manageOffer();
                        cmd.param=plan;
                        wallet.doAction(cmd,callback);
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
        wallet.orderId='';
        var qcmd = wallet.apiQuery.OrderbookTrades();
        qcmd.param={selling:plan.selling,buying:plan.buying};
        wallet.doActionQuery(qcmd,function(err,data){
            
            async.eachLimit(data.records, 1, function (record, callback) {
               orderId = toNumber(record.id);
               if(''===wallet.orderId){console.log("init trade return");callback(null);return;};
                if(orderId>wallet.orderId){
                  console.log("got new trades anylising*****");
                  if(record.seller_attr===wallet.address){
                    plan.genPlanBuy(record,function(err,plan){
                      console.log("excute plane (%d)",plan.price, plan.selling, plan.buying);
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
                    callback(null);
                }
             },
             function (err) {
                        if (err) {
                            console.error(err);
                           // mail.notifyError(err, '监控出错');
                        } else {
                            console.log("..../DONE check" +"RECHECK IN 5s.");
                            wallet.orderId=orderId;
                            setTimeout(function () {
                                listenTrade(wallet,plan);
                            }, 5* 1000);
                        }
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




