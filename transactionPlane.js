/** 
 *  
    priceLine:0.019  exchange rate = selling / buying
    margin:0.05
    buying:{publicKey:'',assetCode:'CNY'}
    selling:'native'
    amount:'the total  selling amount '
    rate:0.1 
 */
var Sys = require('./sysconfig.js').Sys;
function Plan(buying,selling,priceLine,margin,amount,rate){
     var me = this;
     this.amount=amount;
     this.rate = 0.1||rate;
     this.priceLine = priceLine;
     this.margin=0.05||margin;
     this.buying = buying;
     this.selling = selling;
}
/**
 *gen sell plan use the priceLine&margin and amount&rate
 * 
 */
Plan.prototype.genPlan = function(callback) {
    var me = this;
    var plans = [];
    
    for(var i=1; i< 1/me.rate; i++) {
       var plan = {};
       plan.selling=me.selling;
       plan.buying=me.buying;
       plan.amount = (me.amount * me.rate).toString();
       plan.price = Math.round((me.priceLine * (1 + me.margin * i))*100000000)/100000000;
       
       plans.push(plan);
    }
    callback(null,plans);
};

/**
 * 
gen buy cny plan after selling
@price the price in transaction, eg.rate= selling / buying;
*/
Plan.prototype.genPlanBuy = function(record,callback) {
     console.log("execute buy %s after sell (%s)",record.sold_asset_code||record.sold_asset_type,record.bought_asset_code||record.bought_asset_type);
    var me = this;
    var plan={};
    var selling=null;
    var buying=null;
    if('native'===record.bought_asset_code){
        selling='native';
    }else{
        selling={publicKey:record.bought_asset_issuer,assetCode:record.bought_asset_code};
    }
    if('native'===record.sold_asset_type){
        buying='native';
    }else{
        buying={publicKey:record.sold_asset_issuer,assetCode:record.sold_asset_type};
    }
    plan.selling=selling;
    plan.buying=buying;
    plan.amount=record.bought_amount;
    plan.price = Math.round((Number(record.bought_amount)/Number(record.sold_amount))*(1-me.margin)*100000000)/100000000;
    callback(null,plan);
};
////gen sell xlm plan after selling cny
//@price the price in transaction， eg.rate= buying / selling;
Plan.prototype.genPlanSell = function(record,callback) {
    var me = this;
    var plan={};
    console.log("execute buy %s after sell (%s)",record.bought_asset_code||record.bought_asset_type,record.sold_asset_code||record.sold_asset_type);
    var selling=null;
    var buying=null;
    if('native'===record.bought_asset_code){
        selling='native';
    }else{
        selling={publicKey:record.sold_asset_issuer,assetCode:record.sold_asset_type};
    }
    if('native'===record.sold_asset_type){
        buying='native';
    }else{
        buying={publicKey:record.bought_asset_issuer,assetCode:record.bought_asset_code};
    }
    plan.selling=selling;
    plan.buying=buying;
    plan.amount=record.sold_amount;
    plan.price = Math.round((Number(record.sold_amount)/Number(record.bought_amount))*(1+me.margin)*100000000)/100000000;
    callback(null,plan);
};
//run this file to test plan
var test1 = false,test2=false;

if(test1){
   var buying={publicKey:Sys.robot1.address,assetCode:'CNY'};
    var selling='native';
    var priceLine=0.019;
    var margin=0.05;
    var amount = 100;
    var rate = 0.1;
    var tPlan = new Plan(buying,selling,priceLine,margin,amount,rate);
    tPlan.genPlan(function(a,b){
        console.log("*********************1. init sell plan**********************************");
        console.log(b);
        console.log("*********************2. gen buy plan & 3 then sell again--************************************");
        b.forEach(function(v){
           /* tPlan.genPlanBuy(v.price,v.amount,function(a,b){
                console.log(b);
                tPlan.genPlanSell(b.price,b.amount,function(a,b){

                    console.log(b);
                });
            });*/
        });
    }); 
};
if(test2){};

exports.Plan = Plan;
