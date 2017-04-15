#Stellar market maker robot


## build

- Run `npm install` 

- config sysconfig.js set below @how to config

- Run `node robotWG.js` 

#how to config syscofig.js

#3put you wallet info in robot1;

Sys.robot1 = {
                address:'GBTIXAAGP36QLUYQOEZR7JLFEOMR3UDDLOSM4NFYHN6TWE3MQHG7FROR',
                secret:'xxx'
            };

##set the plan:

@parm buying asset: the asset you buying, put the issuer publicKey, and code;

@param selling asset: the asset you selling

@param priceLine number: the price line the robot will sell the asset you selling;priceLine = buyying amount / selling amount, eg. 0.019/1 of CNY/XLM; 

@param margin number: the price margin, eg. price = priceLine * (1 + margin) 

@param amount number: the amount of the selling asset you want to offer

@param rate number: the rate of one offer , every offer amount = amount*rate 

###exmple:

Sys.plan1 = {
    buying:{publicKey:'GBTIXAAGP36QLUYQOEZR7JLFEOMR3UDDLOSM4NFYHN6TWE3MQHG7FROR',assetCode:'CNY'},
    selling:'native',
    priceLine:0.019,
    margin:0.05,
    amount:1000,
    rate:0.2
};


