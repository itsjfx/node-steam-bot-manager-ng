const EventEmitter = require('events').EventEmitter;
const Bot = require('../classes/Bot.js');

/**
 * Our BotManager, extends EventEmitter to have an in-built EventEmitter for logging under 'log'.
 * @class
 * @extends EventEmitter
 */
class BotManager extends EventEmitter {
	/**
	 * A Bot Manager instance
	 * @constructor
	 * @param {Object} [options] - contains optional settings for the bot manager
	 * @param {number} [options.cancelTime] - cancelTime in ms that node-tradeoffer-manager will cancel an outgoing offer
	 * @param {Object} [options.inventoryApi] - steam-inventory-api-ng inventoryApi instance which is used in any inventory functions in the bot manager
	 * @param {number} [options.loginRetryTime=30] - retry time in seconds for how long we should wait before logging back into an account once being logged out
	 * @param {Object} [options.defaultConfirmationChecker] - settings for the default behaviour for confirmation checking. Omit if you do not want confirmation checking to be applied by default. https://github.com/DoctorMcKay/node-steamcommunity/wiki/Steam-Confirmation-Polling
	 * @param {string} [options.defaultConfirmationChecker.type] - "manual" or "auto" - manual will not have the identity secret passed into startConfirmationChecker, whereas auto will - and auto will accept any mobile confirmation.
	 * @param {number} [options.defaultConfirmationChecker.pollInterval] - the interval in ms for which it checks. 10000 is a safe amount and will avoid rate limiting.
	 * @param {Object} [options.loginInterval] - an object containing login interval settings
	 * @param {number} [options.loginInterval.time] - time in seconds for the interval to last
	 * @param {number} [options.loginInterval.limit] - the number of logins we can make in this interval before we start blocking
	 * @param {Object} [options.assetSettings] - asset settings which are parsed into the constructor for steam-tradeoffer-manager
	 * @param {string} [options.assetSettings.language] - which language will be used for item descriptions
	 * @param {boolean} [options.assetSettings.globalAssetCache] - see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#globalassetcache
	 * @param {number} [options.assetSettings.assetCacheMaxItems] - see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#assetcachemaxitems
	 * @param {number} [options.assetSettings.assetCacheGcInterval] - see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#assetcachegcinterval
	 * @param {string} [options.assetSettings.dataDirectory] - see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#datadirectory
	 */
	constructor(options = {}) {
		super();
		this.options = options;
		this.options.cancelTime = options.cancelTime;
		this.options.inventoryApi = options.inventoryApi;
		this.options.loginRetryTime = options.loginRetryTime || 30;
		this.options.defaultConfirmationChecker = options.defaultConfirmationChecker || {};
		this.options.loginInterval = options.limitInterval || {};
		this.options.loginInterval.time = this.options.loginInterval.time || 120;
		this.options.loginInterval.limit = this.options.loginInterval.limit || 2;
		this.options.assetSettings = options.assetSettings || {};
		this.bots = [];

		this._rotations = {
			type: {},
			subtype: {}
		};

		this.recentLogins = 0;
		setInterval(() => {
			this.recentLogins = 0;
		}, this.options.loginInterval.time * 1000);
	}

	/**
	 * Adds a new bot to the bot manager.
	 * @param {Object} loginInfo - an object containing details for the logon - these are parsed into node-steam-user's logOn method, so read this documentation for more info: https://github.com/DoctorMcKay/node-steam-user#logondetails - the documentation below is what I use for steam bots
	 * @param {string} loginInfo.accountName - If logging into a user account, the account's name
	 * @param {string} loginInfo.password - If logging into an account without a login key or a web logon token, the account's password
	 * @param {string|Buffer} [loginInfo.identity] - the identity_secret of the account - as a Buffer, hex string, or base64 string
	 * @param {string|Buffer} [loginInfo.secret] - the shared_secret of the account - as Buffer, hex string, or base64 string
	 * @param {string} [loginInfo.type] - what type the bot will be, there can be multiple bots of the same type (e.g. storage)
	 * @param {string} [loginInfo.subtype] - what subtype the bot will be, there can be multiple bots of the same subtype.
	 * @param {string} [loginInfo.id] - a unique identifier for the bot in the case that in your code you want a way of mapping this type of bot for any accountName it gets changed to
	 * @param {Object} [loginInfo.confirmationChecker] - an object containing behaviour for the confirmation checker for this bot, just like the defaultConfirmationChecker object in the constructor
	 * @param {string} [loginInfo.confirmationChecker.type] - "manual" or "auto" - manual will not have the identity secret passed into startConfirmationChecker, whereas auto will - and auto will accept any mobile confirmation.
	 * @param {number} [loginInfo.confirmationChecker.pollInterval] - the interval in ms for which it checks. 10000 is a safe amount and will avoid rate limiting.
	 * @param {Object[]} [managerEvents] - an array containing the node-steam-tradeoffer-manager events for the bot. https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#events - the mapping for the objects are below
	 * @param {string} [managerEvents[].name] - the name of the event, same as the events from node-steam-tradeoffer-manager
	 * @param {string} [managerEvents[].cb] - the function to be called. (e.g. for the newOffer event it would be cb: (offer) => {})
	 * @param {Object} [pollData] - pollData for the bot that can be gracefully resumed. https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/Polling
	 * @returns {Promise} - Promise object which will resolve once the bot has successfully logged in for the first time. Returns the bot object which will contain the manager, community and client (and other things related to the bot). Rejects on the first login if something goes wrong.
	 */
	addBot(loginInfo, managerEvents, pollData) {
		if (loginInfo.id && this.botFromId(loginInfo.id)) {
			this.emit('log', 'error', `A bot with identifier: ${loginInfo.id} already exists`);
			throw new Error(`A bot with identifier: ${loginInfo.id} already exists`);
		}

		if (loginInfo.accountName && this.botFromAccountName(loginInfo.accountName)) {
			this.emit('log', 'error', `A bot with accountName: ${loginInfo.accountName} already exists`);
			throw new Error(`A bot with accountName: ${loginInfo.accountName} already exists`);
		}

		const bot = new Bot(this, loginInfo, this.options, this.bots.length, managerEvents, pollData);
		this.bots.push(bot);

		bot.on('log', (type, log) => this.emit('log', type, log));
		return bot._initialLogin();
	}

	/**
	 * Triggers the login for the bot, which is handled in the events in addBot. Used when initially logging in also.
	 * Alias of login
	 * @param {number} botIndex - the index in the bots array for the bot we wish to relogin
	 * @param {number} timer - the time in ms we want to wait before we log the bot in
	 */
	retryLogin(botIndex, timer = 0) {
		this.bots[botIndex].retryLogin(timer);
	}

	/**
	 * Triggers the login for a bot, which is handled in the events in addBot. Used when initially logging in also.
	 * @param {number} botIndex - the index in the bots array for the bot we wish to relogin
	 * @param {number} timer - the time in ms we want to wait before we log the bot in
	 */
	login(botIndex, timer = 0) {
		this.bots[botIndex].retryLogin(timer);
	}

	/**
	 * Loads all the inventories for the bots
	 * @param {int} appid - The Steam application ID of the app 
	 * @param {int} contextid - The ID of the context within the app you wish to retrieve 
	 * @param {boolean} tradableOnly - True to get tradeable items only
	 * @returns {Promise} - Promise object containing all the inventories for the bots. The botIndex is contained in each item.
	 */
	loadInventories(appid, contextid, tradableOnly) {
		return Promise.all(this.bots.map((bot, i) => {
			return this.options.inventoryApi.get(
				bot.steamid,
				appid,
				contextid,
				tradableOnly,
				10000
			)
			.then((res) => {
				const inventory = res.inventory;
				inventory.forEach((item) => {
					item.steamid = bot.steamid;
					item.botIndex = i; // for legacy
				});
				return inventory;
			});
		}))
		.then((inventories) => {
			return inventories.concat.apply([], inventories);
		});
	}

	/**
	 * Gets the botIndex for a given Steam ID
	 * @param {string} steamid - Steam ID of the bot
	 * @returns {number} - the index of the bot in the bots array
	 */
	botIndexFromSteamid(steamid) {
		return this.bots.map((bot) => bot.steamid).indexOf(steamid);
	}

	/**
	 * Gets the Steam ID of a bot from the given botIndex
	 * @param {number} botIndex - the index of the bot in the bots array
	 * @returns {string} - Steam ID of the bot
	 */
	botSteamidFromIndex(botIndex) {
		return this.bots[botIndex].steamid;
	}

	/**
	 * Gets the number of bot object for the bots id property (unique property)
	 * @param {string} id - the id of the bot
	 * @returns {Bot} - the bot object
	 */
	botFromId(id) {
		return this.botObjectFromId(id);
	}

	/**
	 * Gets the number of bot object for the bots id property (unique property)
	 * @param {string} steamid - the steamid of the bot
	 * @returns {Bot} - the bot object
	 */
	botFromSteamId(steamid) {
		return this.botObjectFromSteamId(steamid);
	}

	/**
	 * Gets the number of bot object for the bots id property (unique property)
	 * @param {string} steamid - the steamid of the bot
	 * @returns {Bot} - the bot object
	 */
	botObjectFromSteamId(steamid) {
		return this.bots.find(bot => bot.steamid === steamid);
	}

	/**
	 * Gets the number of bot object for a given accountName
	 * @param {string} accountName - the accountName for the bot
	 * @returns {Bot} - the bot object
	 */
	botFromAccountName(accountName) {
		return this.botObjectFromAccountName(accountName);
	}

	/**
	 * Gets the number of bot object for a given botIndex
	 * @param {number} botIndex - the index of the bot in the bots array
	 * @returns {Bot} - the bot object
	 */
	botFromIndex(botIndex) {
		return this.botObjectFromIndex(botIndex);
	}

	/**
	 * Gets the number of bot object for the bots id property (unique property)
	 * @param {string} id - the id of the bot
	 * @returns {Bot} - the bot object
	 */
	botObjectFromId(id) {
		return this.bots.find((bot) => bot.id === id);
	}

	/**
	 * Gets the number of bot object for a given accountName
	 * @param {string} accountName - the accountName for the bot
	 * @returns {Bot} - the bot object
	 */
	botObjectFromAccountName(accountName) {
		return this.bots.find((bot) => bot.loginInfo.accountName === accountName);
	}

	/**
	 * Gets the number of bots added to the bot manager
	 * @returns {number} - the number of bots added to the bot manager
	 */
	numberOfBots() {
		return this.bots.length;
	}

	/**
	 * Gets the number of bot object for a given botIndex
	 * @param {number} botIndex - the index of the bot in the bots array
	 * @returns {Bot} - the bot object
	 */
	botObjectFromIndex(botIndex) {
		return this.bots[botIndex];
	}

	/**
	 * Gets a list of bots filtered by a type
	 * @param {String} type - the desired type
	 * @returns {Bot[]} - the bot objects
	 */
	getBotsByType(type) {
		return this.bots.filter((bot) => bot.type === type);
	}

	/**
	 * Gets a list of bots filtered by a subtype.
	 * @param {String} subtype - the desired subtype
	 * @returns {Bot[]} - the bot objects
	 */
	getBotsBySubtype(type, subtype) {
		return this.bots.filter((bot) => bot.type === type && bot.subtype === subtype);
	}

	/**
	 * Gets a list of bots filtered by a subtype only.
	 * @param {String} subtype - the desired subtype
	 * @returns {Bot[]} - the bot objects
	 */
	getBotsBySubtypeOnly(subtype) {
		return this.bots.filter((bot) => bot.subtype === subtype);
	}

	/**
	 * Gets a bot by a type by rotating through the filtered bots.
	 * @param {String} type - the desired type
	 * @returns {Bot} - the bot
	 */
	getBotByType(type) {
		if (!this._rotations.type[type])
			this._rotations.type[type] = this._rotateArray((bot) => bot.type == type, 0);
		
		return this._rotations.type[type]();
	}

	/**
	 * Gets a bot by a subtype by rotating through the filtered bots.
	 * @param {String} type - the desired type
	 * @param {String} subtype - the desired subtype
	 * @returns {Bot} - the bot
	 */
	getBotBySubtype(type, subtype) {
		if (!this._rotations.subtype[type])
			this._rotations.subtype[type] = {};
		if (!this._rotations.subtype[type][subtype])
			this._rotations.subtype[type][subtype] = this._rotateArray((bot) => bot.type === type && bot.subtype === subtype, 0);
		
		return this._rotations.subtype[type][subtype]();
	}

	_rotateArray(filter, repeat = 0) {
		let pos = 0;
		let repeats = 0;
		return () => {
			const arr = this.bots.filter(filter);
			if (pos > arr.length -1) pos = 0;
			if (repeats >= repeat) {
				repeats = 0;
				return arr[pos++];
			} else {
				repeats++;
				return arr[pos];
			}
		}
	}
}

module.exports = BotManager;