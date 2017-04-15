/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var Sys = {};
Sys.cny = 'CNY';
Sys.url = 'https://horizon.stellar.org';
Sys.setOffer=false;
Sys.robot1 = {
                address:'GBTIXAAGP36QLUYQOEZR7JLFEOMR3UDDLOSM4NFYHN6TWE3MQHG7FROR',
                secret:'xxx'
            };
Sys.robot2 = {
                address:'GA56P3TTJHPPGE6XMOHMWNE3MOZZORK6GWGOLORYZJ3AZUY773G2M3PD',
                secret:'xxx'
            };

Sys.plan1 = {
    buying:{publicKey:'GBTIXAAGP36QLUYQOEZR7JLFEOMR3UDDLOSM4NFYHN6TWE3MQHG7FROR',assetCode:'CNY'},
    selling:'native',
    priceLine:0.019,
    margin:0.05,
    amount:1000,
    rate:0.2
};

exports.Sys = Sys;
