'use strict';

let SteamUser = require('steam-user');
let SteamCommunity = require('steamcommunity');
let SteamTotp = require('steam-totp');
let TradeOfferManager = require('steam-tradeoffer-manager');

let BotManager = function(options) {
	if (!options) options = {};

	this.domain = options.domain || 'localhost';
	this.cancelTime = options.cancelTime || 420000;
	this.inventoryApi = options.inventoryApi;
	this.bots = [];
};

BotManager.prototype.addBot = function(loginDetails, managerEvents, type, pollData) {
	let self = this;
	return new Promise((resolve, reject) => {
		//Create instances
		let client = new SteamUser();
		let community = new SteamCommunity();
		let manager = new TradeOfferManager({
			steam: client,
			community: community,
			domain: this.domain,
			cancelTime: this.cancelTime
		});
		
		if (pollData) {
			manager.pollData = pollData;
			console.log("Set pollData");
		}
		
		if (managerEvents) {
			managerEvents.forEach((event) => manager.on(event.name, event.cb));
			console.log('Set manager events:\n\t- ' + managerEvents.map((event) => event.name));
		}
		
		let botIndex = self.bots.length;
		
		const botArrayLength = this.bots.push({
			client: client,
			manager: manager,
			community: community,
			loginInfo: loginDetails,
			// apiKey: manager.apiKey,
			// steamid: client.steamID.getSteamID64(),
			botIndex: botIndex,
			type: type,
			loggedIn: false,
			retryingLogin: false,
			initialLogin: true
		});
		
		
		community.on('sessionExpired', (err) => {
			console.log("Web Session expired, retrying login in 30 seconds");
			self.bots[botIndex].loggedIn = false;
			self.bots[botIndex].retryingLogin = false;
			// if (self.bots[botIndex].retryingLogin) return console.log("Login already retrying");
			setTimeout(() => {
				self.retryLogin(botIndex)
			}, 30000);
			// reject(err);
		});
		
		client.on('error', (err) => {
			console.log("Logged out of Steam, retrying login in 30 seconds");
			self.bots[botIndex].loggedIn = false;
			self.bots[botIndex].retryingLogin = false;
			// if (self.bots[botIndex].retryingLogin) return console.log("Login already retrying!!");
			setTimeout(() => {
				self.retryLogin(botIndex);
			}, 30000);
			// reject(err);
		});
		
		client.on('loggedOn', (details) => {
			if (details.eresult !== 1 && self.bots[botIndex].initialLogin) {
				return reject(details);
			}
			self.bots[botIndex].steamid = client.steamID.getSteamID64();
		});
		
		if (loginDetails.shared) {
			client.on('steamGuard', (domain, callback) => {
				if (domain == null) {
					console.log("Steam guard code failed, re-retrying in 30 seconds...");
					setTimeout(function(){
						callback(SteamTotp.getAuthCode(self.bots[botIndex].loginInfo.shared));
					}, 30 * 1000);
				}
			});
		}
		
		client.on('webSession', (sessionID, cookies) => {
			let login = new Promise((resolve, reject) => {
				console.log("Replacing web session");
				community.setCookies(cookies);
				if (loginDetails.identity) community.startConfirmationChecker(10000, loginDetails.identity);
				manager.setCookies(cookies, (err) => {
					if (err) reject(err);
					self.bots[botIndex].apiKey = manager.apiKey;
					self.bots[botIndex].community = community; // ?
					self.bots[botIndex].loggedIn = true;
					self.bots[botIndex].retryingLogin = false;
					resolve(botIndex);
				});
			});
			
			login
			.catch((err) => {
				console.log(err);
				console.log('Error logging back in, retrying in 1 min');
				return new Promise((resolve) => {
					setTimeout(resolve, 60 * 1000);
				})
				.then(() => {self.retryLogin(botIndex)})
				// if (self.bots[botIndex].initialLogin)
					// reject(err);
			})
			.then((res) => {
				console.log('Bot logged back in');
				if (self.bots[botIndex].initialLogin) {
					self.bots[botIndex].initialLogin = false;
					resolve(self.bots[botIndex]);
				} else {
					return;
				}
			});
		});
		self.retryLogin(botIndex);
		console.log("Bot added");
		// resolve(self.retryLogin(botIndex));
	});
};

BotManager.prototype.retryLogin = function(botIndex) {
	let self = this;
	if (self.bots[botIndex].retryingLogin == true) return console.log("Already retrying");
	self.bots[botIndex].retryingLogin = true;
	console.log("Retrying login", botIndex);
	
	let bot = self.bots[botIndex];
	//console.log(self.bots[botArrayLength-1]);
	let loginDetails = bot.loginInfo;
	//console.log(self.bots);
	if (loginDetails.shared) loginDetails.twoFactorCode = SteamTotp.getAuthCode(loginDetails.shared);

	if (!bot.client.steamID) { //If we need to log it into Steam
		console.log("Logging into Steam Client");
		bot.client.logOn(loginDetails);
	} else { //We just need to refresh cookies, make a new webLogOn
		bot.client.webLogOn();
	}
	return true;
}

BotManager.prototype.loadInventories = function(appid, contextid, tradableOnly) {
	return Promise.all(this.bots.map((bot, i) => {
		return this.inventoryApi.get({
			appid,
			contextid,
			retries: 100,
			retryDelay: 3000,
			steamid: bot.steamid,
			tradable: tradableOnly,
		})
		.then((res) => {
			const inventory = res.items;
			inventory.forEach((item) => item.botIndex = i);
			return inventory;
		});
	}))
	.then((inventories) => {
		return inventories.concat.apply([], inventories);
	});
};

BotManager.prototype.botIndexFromSteamid = function(steamid) {
	return this.bots.map((bot) => bot.steamid).indexOf(steamid);
};

BotManager.prototype.botSteamidFromIndex = function(botIndex) {
	return this.bots[botIndex].steamid;
};

BotManager.prototype.numberOfBotsLoggedIn = function() {
	return this.bots.length;
};

BotManager.prototype.botObjectFromIndex = function (botIndex) {
	return this.bots[botIndex];
}

module.exports = BotManager;
