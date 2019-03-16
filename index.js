'use strict';

let SteamUser = require('steam-user');
let SteamCommunity = require('steamcommunity');
let SteamTotp = require('steam-totp');
let TradeOfferManager = require('steam-tradeoffer-manager');
let SteamInventoryAPI = require('steam-inventory-api');

let BotManager = function(options) {
	if (!options) options = {};

	this.domain = options.domain || 'localhost';
	this.cancelTime = options.cancelTime || 420000;
	this.inventoryApi = options.inventoryApi;
	this.bots = [];
};

BotManager.prototype.addBot = function(loginDetails, managerEvents, type) {
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
		});
		
		
		community.on('sessionExpired', (err) => {
			console.log("Web Session expired, retrying login in 30 seconds");
			self.bots[botIndex].loggedIn = false;
			self.bots[botIndex].retryingLogin = false;
			// if (self.bots[botIndex].retryingLogin) return console.log("Login already retrying");
			setTimeout(() => {
				self.retryLogin(botIndex)
			}, 30000);
			reject(err);
		});
		
		client.on('error', (err) => {
			console.log("Logged out of Steam, retrying login in 30 seconds");
			self.bots[botIndex].loggedIn = false;
			self.bots[botIndex].retryingLogin = false;
			// if (self.bots[botIndex].retryingLogin) return console.log("Login already retrying!!");
			setTimeout(() => {
				self.retryLogin(botIndex);
			}, 30000);
			reject(err);
		});
		
		client.on('loggedOn', (details) => {
			if (details.eresult !== 1) {
				return reject(details);
			}
			self.bots[botIndex].steamid = client.steamID.getSteamID64();
		});
		
		client.on('webSession', (sessionID, cookies) => {
			let login = new Promise((resolve, reject) => {
				console.log("Replacing web session");
				community.setCookies(cookies);
				community.startConfirmationChecker(10000, loginDetails.identity);
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
				.then(() => {login})
				reject(err);
			})
			.then((res) => {
				console.log('Bot logged back in');
				resolve(this.bots[botIndex]);
			});
		});
		self.retryLogin(botIndex);
		console.log("Bot added");
		// resolve(self.retryLogin(botIndex));
	});
};

BotManager.prototype.retryLogin = function(botIndex) {
	let self = this;
	self.bots[botIndex].retryingLogin = true;
	console.log("Retrying login", botIndex);
	
	let bot = self.bots[botIndex];
	//console.log(self.bots[botArrayLength-1]);
	let loginDetails = bot.loginInfo;
	//console.log(self.bots);
	loginDetails.twoFactorCode = SteamTotp.getAuthCode(loginDetails.shared);

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

BotManager.prototype.addJob = function(job) {
	if (job.length > 0) job.forEach(function(job) { this.botJobs.push(job) });
	else this.botJobs.push(job);
};

BotManager.prototype.processJobs = function(jobsToProcess) {
   if (!jobsToProcess) jobsToProcess = 1;
	let jobProcesses = [];
   for (let i = 0; i < jobsToProcess; i++) {
	  jobProcesses.push(this.processJob(this.botJobs.shift()));
   }
	return jobProcesses;
};

BotManager.prototype.processJob = function({type, multi, constraints, args, fn, bots}) {
	return new Promise((resolve, reject) => {
		console.log('New job:\n\t-', type, bots, multi, constraints);

		//Get an array of bot indexes, which are permitted to do the job
		if (!bots) bots = this.bots.map((bot) => bot.botIndex);
		else if (typeof bots == 'number') bots = [bots];
		else if (!Array.isArray(bots)) throw 'options.bots is not in a valid format';
		//Test constraints for bots permitted
		if (constraints) {
			bots = bots.filter((botIndex) => {
				return constraints.reduce((prev, constraintName) => {
					console.log('Testing',constraintName+'. The result was:', this.testConstraint(constraintName, args, botIndex));
					return this.testConstraint(constraintName, args, botIndex) && prev;
				}, true);
			});
		}

		console.log('Bots (of selected) which pass all job constraints', bots);

		if (bots.length < 1) return reject('No bots meet all the criteria');

		let botObjects;
		if (!multi) botObjects = this.bots[bots[0]];
		else botObjects = bots.map((botIndex) => this.bots[botIndex]);
		resolve(botObjects);
	})
	.then((botObjects) => Promise.resolve(fn(args, botObjects)))
	.then((res) => {
		console.log('A job of type: ' + type + ' just completed\n\t- ' + res);
		if (bots && constraints) {
			bots.forEach((botIndex) => {
				constraints.forEach((constraintName) => {
					let constraint = this.jobConstraints[constraintName];
					if (constraint) {
						if (constraint.succeededChange(args) !== undefined)
							constraint.botConstraintValues[botIndex] += constraint.succeededChange(args);
					}
				});
			});
		}
	})
	.catch((err) => {
		console.log('There was an error completing a job of type: ' + type + '\n\t- ' + err);
		bots.forEach((botIndex) => {
			constraints.forEach((constraintName) => {
				let constraint = this.jobConstraints[constraintName];
				if (constraint) {
					if (constraint.failedChange(args) !== undefined)
						constraint.botConstraintValues[botIndex] += constraint.failedChange(args);
				}
			});
		});
		throw err;
	});
};

BotManager.prototype.addJobConstraint = function({name, initialValue, failedChange, succeededChange, testConstraint}) {
	if (!name) throw 'options.name not set';
	if (!testConstraint) throw 'options.testConstraint not set';
	if (!succeededChange && !failedChange) throw 'neither options.succeededChange or options.failedChange are defined';
	if (!initialValue) throw 'options.initialValue not set';

	this.jobConstraints[name] = {
		initialValue: initialValue,
		failedChange: failedChange,
		succeededChange: succeededChange,
		testConstraint: testConstraint,
		botConstraintValues: []
	};
	return 'constraint has been added';
};

BotManager.prototype.testConstraint = function(constraintName, args, botIndex) {
	if (!this.jobConstraints[constraintName]) return;
	const constraintTest = this.jobConstraints[constraintName].testConstraint;

	let botConstraintValues = this.jobConstraints[constraintName].botConstraintValues;
	if (botIndex && botConstraintValues[botIndex]) {
		return constraintTest(this.bots[botIndex], botConstraintValues[botIndex], args);
	} else if (botIndex !== undefined) {
		botConstraintValues[botIndex] = this.jobConstraints[constraintName].initialValue(botIndex);
		return constraintTest(this.bots[botIndex], botConstraintValues[botIndex], args);
	} else {
		return this.bots.map((bot, i) => {
			if (!botConstraintValues[i]) {
				botConstraintValues[botIndex] = this.jobConstraints[constraintName].initialValue(botIndex);
			}
			return constraintTest(bot, botConstraintValues[i], args) ? i : undefined;
		}).filter((val) => val !== undefined);
	}
};

BotManager.prototype.botIndexFromSteamid = function(steamid) {
	return this.bots.map((bot) => bot.steamid).indexOf(steamid);
};

BotManager.prototype.botSteamidFromIndex = function(botIndex) {
	return this.bots[botIndex].steamid;
};

BotManager.prototype.openJobs = function() {
	return this.botJobs.length;
};

BotManager.prototype.setConstraintValues = function(name, value) {
	if (this.jobConstraints[name]) {
		this.jobConstraints[name].botConstraintValues = this.jobConstraints[name].botConstraintValues.map(() => value);
   }
};

BotManager.prototype.numberOfBotsLoggedIn = function() {
	return this.bots.length;
};

BotManager.prototype.botObjectFromIndex = function (botIndex) {
	return this.bots[botIndex];
}

module.exports = BotManager;
