/* 
钱包
 * not used yet
var pair = StellarSdk.Keypair.random();

pair.secret();
// SAV76USXIJOBMEQXPANUOQM6F5LIOTLPDIDVRJBFFE2MDJXG24TAPUU7
pair.publicKey();
// GCFXHS4GXL6BVUCXBWXGTITROWLVYXQKQLF4YH5O5JT3YZXCYPAFBJZB
 */
var EventEmitter = require('events').EventEmitter;
var util         = require('util');
var async        = require("async");
var StellarSdk = require('stellar-sdk');
var Account    = require('stellar-sdk').Account;

function Wallet(address, seed, server, name) {
	EventEmitter.call(this);
	var self = this;
	
	this.name = name || 'Wallet';
	this.server = server;
	this.address = address;
	this.seed    = seed;
	
	this.lines  = {};
	this.offers = {};
	this.balances = {};
	
	this.loadState = {
		info : false,
		offer : false
	};
	
	this.eventStream;
	this.myEventHandler;
}
util.inherits(Wallet, EventEmitter);

Wallet.prototype.reset = function() {
	this.lines  = {};
	this.offers = {};
	this.balances = {};
}
/**
 * 
 * @returns {address,secret}
 */
Wallet.prototype.newAccount = function() {
        var pair = StellarSdk.Keypair.random();
        var secret = pair.secret();
        var pub = pair.publicKey();
        console.log(pub);
        var rst = {publicKey:pub,secret:secret};
        return rst;
}

Wallet.prototype.setAccount = function (address, seed) {
	var self = this;
	
	if (!StellarSdk.Keypair.isValidPublicKey(address)) {
		console.error('Invalid address!!!');
	}
	var keypair = StellarSdk.Keypair.fromSeed(seed);
	if (keypair.address() != address) {
		console.error('Invalid pair!!!');
	}
	self.address = address;
	self.seed  = seed;
}

Wallet.prototype.queryInfo = function(callback) {
	var self = this;
	self.server.accounts().accountId(self.address).call().then(function(res){
		//console.log(res);
		var lines = {};
		var balances = {};
		res.balances.forEach(function(line){
			if (line.asset_type == 'native') {
				lines['XLM'] = parseFloat(line.balance);
				balances['XLM'] = parseFloat(line.balance)
			} else {
				var key = tradeInfo(line.asset_code, line.asset_issuer); 
				lines[key] = parseFloat(line.balance);
				if (!balances[line.asset_code]) {
					balances[line.asset_code] = 0;
				}
				balances[line.asset_code] += parseFloat(line.balance);
			}
		});
		self.lines = lines;
		self.balances = balances;
		./stellarWallet.js
	}).catch(function(err){
		console.error('queryInfo', err);
		callback(err, null);
	});
}

Wallet.prototype.queryOffer = function(callback) {
	var self = this;
	self.server.offers('accounts', self.address).call().then(function (offerResult) {
	    var offers = {};
	    offerResult.records.forEach(function(offer){
	    	offers[offer.id] = offer;
	    });
	    self.offers = offers;
	    callback(null, offers);
	}).catch(function (err) {
		console.error('queryOffer', err);
		callback(err, null);
	});
}

Wallet.prototype.checkFunded = function(address, callback) {
	var self = this;
	self.server.accounts().accountId(address || self.address).call().then(function(accountResult){
		callback(null, true);
	}).catch(function(err){
		if (err.name === 'NotFoundError') {
			callback(null, false);
		} else {
			callback(err, false);
		}
	});
}

Wallet.prototype.sendXLM = function(target, xlm, memoId, callback) {
	var self = this;
	console.log('Sending', xlm, 'XLM..', memoId ? memoId : '');
	self.server.loadAccount(self.address).then(function(account){
		//console.log('loaded', account);
		var payment = StellarSdk.Operation.payment({
			destination: target,
			asset: StellarSdk.Asset.native(),
			amount: xlm.toString()
        });
		var memo = memoId ? StellarSdk.Memo.id('' + memoId) : StellarSdk.Memo.none();
        var tx = new StellarSdk.TransactionBuilder(account, {memo:memo}).addOperation(payment).build();
        tx.sign(StellarSdk.Keypair.fromSeed(self.seed));
        console.log('Sending', xlm, 'XLM...');
        return self.server.submitTransaction(tx);
	}).then(function(txResult){
		console.log('Send done.', txResult.hash);
		//console.log(txResult);
		callback(null, txResult.hash);
	}).catch(function(err){
		console.error('Send Fail !', err);
		callback(err, null);
	});
}

Wallet.prototype.send = function(target, currency, issuer, amount, memoId, callback) {
	var self = this;
	console.log('Sending', amount, currency + '.' + issuer, 'to', target);
	self.server.loadAccount(self.address).then(function(account){
		var payment = StellarSdk.Operation.payment({
			destination: target,
			asset: new StellarSdk.Asset(currency, issuer),
			amount: amount.toString()
        });
		var memo = memoId ? StellarSdk.Memo.id('' + memoId) : StellarSdk.Memo.none();
        var tx = new StellarSdk.TransactionBuilder(account, {memo:memo}).addOperation(payment).build();
        tx.sign(StellarSdk.Keypair.fromSeed(self.seed));
        return self.server.submitTransaction(tx);
	}).then(function(txResult){
		console.log('Send done.', txResult.hash);
		//console.log(txResult);
		callback(null, txResult.hash);
	}).catch(function(err){
		console.error('Send Fail !', err);
		callback(err, null);
	});
}

Wallet.prototype.fund = function(target, xlm, memoId, callback) {
	var self = this;
	console.log('Funding', xlm, 'XLM..');
	self.server.loadAccount(self.address).then(function(account){
		//console.log('loaded', account);
		var payment = StellarSdk.Operation.createAccount({
			destination: target,
			startingBalance: xlm.toString()
        });
		var memo = memoId ? StellarSdk.Memo.id('' + memoId) : StellarSdk.Memo.none();
        var tx = new StellarSdk.TransactionBuilder(account, {memo:memo}).addOperation(payment).build();
        tx.sign(StellarSdk.Keypair.fromSeed(self.seed));
        return self.server.submitTransaction(tx);
	}).then(function(txResult){
		//console.log(txResult);
		console.log('Funded.', txResult.hash);
		callback(null, txResult.hash);
	}).catch(function(err){
		console.error('Fund Fail !', err);
		callback(err, null);
	});
}

Wallet.prototype.sendAndFund = function(address, xlm, memoId, callback) {
	var self = this;
	self.checkFunded(address, function(err, funded){
		if (err) {
			return callback(err, null);
		} else {
			if (funded) {
				self.sendXLM(address, xlm, memoId, callback);
			} else {
				self.fund(address, xlm, memoId, callback);
			}
		}
	});
}

Wallet.prototype.trust = function(currency, issuer, amount, callback) {
	var self = this;
	console.log('Trust', issuer, amount, currency);
	var asset = new StellarSdk.Asset(currency, issuer);
	console.log('Asset', asset);
	self.server.loadAccount(self.address).then(function(account){
		var op = StellarSdk.Operation.changeTrust({
			asset: asset,
			limit: amount.toString()
        });
		var memo = StellarSdk.Memo.none();
        var tx = new StellarSdk.TransactionBuilder(account).addOperation(op).build();
        tx.sign(StellarSdk.Keypair.fromSeed(self.seed));
        return self.server.submitTransaction(tx);
	}).then(function(txResult){
		//console.log(txResult);
		console.log('Trust updated.', txResult.hash);
		callback(null, txResult.hash);
	}).catch(function(err){
		console.error('Trust Fail !', err);
		callback(err, null);
	});
}

Wallet.prototype.data = function(name, value, callback) {
	var self = this;
	console.log('Data:', name, '-', value);
	self.server.loadAccount(self.address).then(function(account){
		var op = StellarSdk.Operation.manageData({
			name: name,
			value: value
        });
        var tx = new StellarSdk.TransactionBuilder(account).addOperation(op).build();
        tx.sign(StellarSdk.Keypair.fromSeed(self.seed));
        return self.server.submitTransaction(tx);
	}).then(function(txResult){
		//console.log(txResult);
		console.log('Data updated.', txResult.hash);
		callback(null, txResult.hash);
	}).catch(function(err){
		console.error('Data Fail !', err);
		callback(err, null);
	});
}

Wallet.prototype.option = function(name, value, callback) {
	var self = this;
	var opt = {};
	opt[name] = value
	console.log('Option:', name, '-', value);
	self.server.loadAccount(self.address).then(function(account){
		var op = StellarSdk.Operation.setOptions(opt);
        var tx = new StellarSdk.TransactionBuilder(account).addOperation(op).build();
        tx.sign(StellarSdk.Keypair.fromSeed(self.seed));
        return self.server.submitTransaction(tx);
	}).then(function(txResult){
		//console.log(txResult);
		console.log('Option updated.', txResult.hash);
		callback(null, txResult.hash);
	}).catch(function(err){
		console.error('Option Fail !', err);
		callback(err, null);
	});
}

Wallet.prototype._offer = function(selling, buying, amount, price, callback) {
	var self = this;
	console.log('Sell', amount, selling.code, 'for', buying.code, '@', price);
	self.server.loadAccount(self.address).then(function(account){
		var op = StellarSdk.Operation.manageOffer({
			selling: selling,
			buying: buying,
			amount: amount.toString(),
			price : price.toString()
        });
        var tx = new StellarSdk.TransactionBuilder(account).addOperation(op).build();
        tx.sign(StellarSdk.Keypair.fromSeed(self.seed));
        return self.server.submitTransaction(tx);
	}).then(function(txResult){
		console.log('Offer done.', txResult.hash);
		console.log(txResult);
		callback(null, txResult.hash);
	}).catch(function(err){
		console.error('Offer Fail !', err);
		callback(err, null);
	});
}

// option {type:'buy', currency:'XLM', issuer: '', base: 'CNY', base_issuer: 'GXXX', amount: 100, price: 0.01}
Wallet.prototype.offer = function(option, callback) {
	var self = this;
	console.log('%s %s %s use %s@ %s', option.type, option.amount, option.currency, option.base, option.price);
	var buying, selling;
	var selling_amount, selling_price;
	
	if (option.type == 'buy') {
		selling = getAsset(option.base, option.base_issuer);
		buying = getAsset(option.currency, option.issuer);
		selling_amount = option.amount * option.price;
		selling_price = 1 / option.price;
	} else {
		selling = getAsset(option.currency, option.issuer);
		buying = getAsset(option.base, option.base_issuer);
		selling_amount = option.amount;
		selling_price = option.price;
	}
	self._offer(selling, buying, selling_amount, selling_price, callback);
}

Wallet.prototype.cancell = function(id, offers, callback) {
	var self = this;
	offers = offers || self.offers;
	if (!offers[id]) return callback('No offer ' + id);
	console.log('Cancel', offers[id]);
	
	self.server.loadAccount(self.address).then(function(account){
		var op = StellarSdk.Operation.manageOffer({
			selling: getAsset(offers[id].selling.asset_code, offers[id].selling.asset_issuer, offers[id].selling.asset_type),
			buying: getAsset(offers[id].buying.asset_code,offers[id].buying.asset_issuer, offers[id].buying.asset_type),
			amount: "0",
			price : offers[id].price,
			offerId : offers[id].id
        });
        var tx = new StellarSdk.TransactionBuilder(account).addOperation(op).build();
        tx.sign(StellarSdk.Keypair.fromSeed(self.seed));
        //console.log(tx.toEnvelope().toXDR('base64'));
        return self.server.submitTransaction(tx);
	}).then(function(txResult){
		console.log('Offer done.', txResult.hash);
		console.log(txResult);
		callback(null, txResult.hash);
	}).catch(function(err){
		console.error('Offer Fail !', err);
		callback(err, null);
	});
}

Wallet.prototype.payments = function(callback) {
	var self = this;
	self.server.payments().forAccount(self.address).call().then(function(page){
		console.log(page);
		console.log(JSON.stringify(page.records[0], undefined, 2));
		callback(null);
		//return page.next();
	}).catch(function(err){
		console.error('Payments Fail !', err);
		callback(err);
	});
}

Wallet.prototype.getBalance = function(curr, issuer) {
	var self = this;
	
	var balance = 0;
	if (curr == 'XLM') {
		balance = self.balances['XLM'] - 200;
	} else {
		var key = tradeInfo(curr, issuer);
		if (self.lines[key]) {
			balance = self.lines[key].balance;
		}
	}
	return balance > 0 ? balance : 0;
}

Wallet.prototype._handleAccountEvent = function(txResponse) {
	var self = this;
	console.log(self.name, 'event', txResponse);
	var envelope_xdr = txResponse.envelope_xdr;
	var result_xdr = txResponse.result_xdr;
	var result_meta_xdr = txResponse.result_meta_xdr;
	
	var operations = txResponse.operations ? txResponse.operations() : null;
	var effects = txResponse.effects ? txResponse.effects() : null;
	
	console.log(result_xdr);
	console.log(result_meta_xdr);
	console.log(envelope_xdr);
	
	console.log('operations', operations);
	console.log('effects', effects);
}

Wallet.prototype.load = function(callback){
	var self = this;
	
	self.reset();
	
	self.myEventHandler = function(txResponse){
		self._handleAccountEvent(txResponse);
	};
	
	var lastCursor = 'now'; //0; // or load where you left off
	self.eventStream = self.server.transactions().forAccount(self.address)
    	.cursor(lastCursor)
    	.stream({
    		onmessage: self.myEventHandler
    	});
	
	self.query(function(err){
		//console.log(JSON.stringify(self.balances, undefined, 2));
		//console.log(JSON.stringify(self.lines, undefined, 2));
		//console.log(JSON.stringify(self.offers, undefined, 2));
		console.log(self.name, 'loaded');
		callback();
	});
}

Wallet.prototype.unload = function(){
	var self = this;

	self.accountObj.removeListener('transaction', self.myHandleAccountEvent);
}

Wallet.prototype.query = function(cb){
	var self = this;
	
	async.parallel([
		function(callback) {
			if (!self.loadState['info']) {
				self.queryInfo(function(err){
					if (!err) { self.loadState['info'] = true; }
					callback(err, 'info');
				});
			} else {
				callback(null, 'info');
			}
		},
		function(callback) {
			if (!self.loadState['offer']) {
				self.queryOffer(function(err){
					if (!err) { self.loadState['offer'] = true; }
					callback(err, Object.keys(self.offers).length + ' offer');
				});
			} else {
				callback(null, Object.keys(self.offers).length + ' offer');
			}
		}
	], function(err, results){
		if (err) { 
			console.error("QueryErr: %s", util.inspect(err)); 
			setTimeout(function(){ self.query(cb); }, 1 * 1000);	
		} else {
			console.log(JSON.stringify(results));
			cb();
		}
	});
}

function getAsset(currency, issuer, asset_type) {
	if (currency == 'XLM' || asset_type == 'native') {
		return StellarSdk.Asset.native();
	} else {
		return new StellarSdk.Asset(currency, issuer);
	}
}

function tradeInfo(currency, issuer) {
	return currency + (currency === 'XLM' ? '' : ('/' + issuer));
}
function getKey(currency_gets, issuer_gets, currency_pays, issuer_pays) {
	var gets = tradeInfo(currency_gets, issuer_gets);
	var pays = tradeInfo(currency_pays, issuer_pays);
	return gets + ':' + pays;
}


exports.Wallet = Wallet;
