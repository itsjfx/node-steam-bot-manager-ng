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
	 * @param {Object} [options.defaultConfirmationChecker] - settings for the default behaviour for confirmation checking. Omit if you do not want confirmation checking to be applied by default. https://github.com/DoctorMcKay/node-steamcommunity/wiki/Steam-Confirmation-Polling
	 * @param {string} [options.defaultConfirmationChecker.type] - "manual" or "auto" - manual will not have the identity secret passed into startConfirmationChecker, whereas auto will - and auto will accept any mobile confirmation.
	 * @param {number} [options.defaultConfirmationChecker.pollInterval] - the interval in ms for which it checks. 10000 is a safe amount and will avoid rate limiting.
	 * @param {Object} [options.loginInterval] - an object containing login interval settings
	 * @param {number} [options.loginInterval.time] - time in seconds for the interval to last
	 * @param {number} [options.loginInterval.limit] - the number of logins we can make in this interval before we start blocking
	 * @param {Object} [options.assetSettings={}] - asset settings which are parsed into the constructor for steam-tradeoffer-manager. Set to false to ignore default value
	 * @param {string} [options.assetSettings.language='en'] - which language will be used for item descriptions
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
		this.options.defaultConfirmationChecker = options.defaultConfirmationChecker || {};
		this.options.loginInterval = options.limitInterval || {};
		this.options.loginInterval.time = this.options.loginInterval.time || 60;
		this.options.loginInterval.limit = this.options.loginInterval.limit || 4;
		this.options.assetSettings = options.assetSettings || {
			language: 'en',
		};
		if (options.assetSettings == false) {
			this.options.assetSettings = {};
		}
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
	 * @param {Object} options - an object containing optional settings that can be used when creating the bot
	 * @param {Object[]} [options.managerEvents] - an array containing the node-steam-tradeoffer-manager events for the bot. https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#events - the mapping for the objects are below
	 * @param {string} [options.managerEvents[].name] - the name of the event, same as the events from node-steam-tradeoffer-manager
	 * @param {Function} [options.managerEvents[].cb] - Function callback for this event. (e.g. for the newOffer event it would be cb: (offer) => {})
	 * @param {Object} [options.pollData] - pollData for the bot that can be gracefully resumed. https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/Polling
	 * @param {Object} [options.assetSettings] - asset settings which are parsed into the constructor for steam-tradeoffer-manager, if not supplied the ones from the bot manager are used
	 * @param {string} [options.assetSettings.language='en'] - which language will be used for item descriptions
	 * @param {boolean} [options.assetSettings.globalAssetCache] - see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#globalassetcache
	 * @param {number} [options.assetSettings.assetCacheMaxItems] - see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#assetcachemaxitems
	 * @param {number} [options.assetSettings.assetCacheGcInterval] - see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#assetcachegcinterval
	 * @param {string} [options.assetSettings.dataDirectory] - see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#datadirectory
	 * @returns {Promise} - Promise object which will resolve once the bot has successfully logged in for the first time. Returns the Bot instance which will contain the manager, community and client (and other things related to the bot). Rejects on the first login if something goes wrong.
	 */
	addBot(loginInfo, options = {}) {
		if (loginInfo.id && this.botFromId(loginInfo.id)) {
			this.emit('log', 'error', `A bot with identifier: ${loginInfo.id} already exists`);
			throw new Error(`A bot with identifier: ${loginInfo.id} already exists`);
		}

		if (loginInfo.accountName && this.botFromAccountName(loginInfo.accountName)) {
			this.emit('log', 'error', `A bot with accountName: ${loginInfo.accountName} already exists`);
			throw new Error(`A bot with accountName: ${loginInfo.accountName} already exists`);
		}

		const bot = new Bot(this, loginInfo, options);
		this.bots.push(bot);

		bot.on('log', (type, log) => this.emit('log', type, log));
		return bot;
	}

	/**
	 * A convenient (not so convenient) way of adding multiple bots 
	 * @param {Object[]} bots - Array of objects where
	 * @param {Object} bots.loginInfo - Is loginInfo used in addBot
	 * @param {Object} [bots.options] - Is options used in addBot
	 * @returns {Bot[]} - Array of Bot instances made by addBot
	 */
	addBots(bots) {
		return bots.map((bot) => this.addBot(bot.loginInfo, bot.options));
	}

	/**
	 * An easy way of adding a bot and logging into it
	 * @param {Object} loginInfo - Is loginInfo used in addBot
	 * @param {Object} [options] - Is options used in addBot
	 * @returns {Promise} - Returns a promise where the promised value a Bot instance given by login()
	 */
	addAndLoginToBot(loginInfo, options) {
		let bot = this.addBot(loginInfo, options);
		return bot.login();
	}

	/**
	 * A convenient (not so convenient) way of adding and logging into multiple bots 
	 * @param {Object[]} bots - Array of objects where
	 * @param {Object} bots.loginInfo - Is loginInfo used in addBot
	 * @param {Object} [bots.options] - Is options used in addBot
	 * @returns {Promise} - Returns a promise where the promised value is an array of Bot instances given by login()
	 */
	addAndLoginToBots(bots) {
		return Promise.all(bots.map((botDetails) => {
			let bot = this.addBot(botDetails.loginInfo, botDetails.options);
			return bot.login();
		}))
	}

	/**
	 * Triggers a login for a bot.
	 * Alias of login
	 * @param {number} botIndex - the index in the bots array for the bot we wish to relogin
	 */
	retryLogin(botIndex) {
		return this.bots[botIndex].login();
	}

	/**
	 * Triggers a login for a bot.
	 * @param {number} botIndex - the index in the bots array for the bot we wish to relogin
	 */
	login(botIndex) {
		return this.bots[botIndex].login();
	}

	/**
	 * Loads all the inventories for the bots
	 * @param {int} appid - The Steam application ID of the app 
	 * @param {int} contextid - The ID of the context within the app you wish to retrieve 
	 * @param {boolean} tradableOnly - True to get tradeable items only
	 * @param {int} [retries=200] - Number of total retries until we stop loading all inventories
	 * @param {string} [language='english'] - Language of item descriptions
	 * @returns {Promise} - Promise object containing all the inventories for the bots. The botIndex is contained in each item.
	 */
	loadInventories(appid, contextid, tradableOnly, retries = 200, language = 'english') {
		return Promise.all(this.bots.map((bot, i) => {
			return this.options.inventoryApi.get(
				bot.steamid,
				appid,
				contextid,
				tradableOnly,
				retries,
				language,
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
	 * Gets a list of bots filtered by an array of types
	 * @param {String[]} types - the desired types
	 * @returns {Bot[]} - the bot objects
	 */
	getBotsByTypes(types) {
		return this.bots.filter((bot) => types.includes(bot.type));
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
		if (!this._rotations.type[type]) {
			this._rotations.type[type] = this._rotateArray((bot) => bot.type == type, 0);
		}
		
		return this._rotations.type[type]();
	}

	/**
	 * Gets a bot by a subtype by rotating through the filtered bots.
	 * @param {String} type - the desired type
	 * @param {String} subtype - the desired subtype
	 * @returns {Bot} - the bot
	 */
	getBotBySubtype(type, subtype) {
		// If it's the first time requesting a rotation for this type, add the object
		if (!this._rotations.subtype[type]) {
			this._rotations.subtype[type] = {};
		}
		// If it's the first time requesting a rotation for this subtype with this type, add the rotator
		if (!this._rotations.subtype[type][subtype]) {
			this._rotations.subtype[type][subtype] = this._rotateArray((bot) => bot.type === type && bot.subtype === subtype, 0);
		}
		
		return this._rotations.subtype[type][subtype]();
	}

	/**
	 * Accept an offer with exponential backoff with a factor of 2.
	 * Exponential backoff only applies on retries after the first attempt to accept the offer.
	 * @param {TradeOffer} offer - The offer to be accepted
	 * @param {number} [retries=3] - Number of retries (not including the initial attempt to accept the offer)
	 * @param {number} [delay=15000] - The delay applied on the first retry attempt
	 * @param {number} [maxDelay=60000] - The maximum delay on a retry attempt
	 * @param {number} [factor=2] - The exponential factor applied
	 */
	acceptOffer(offer, retries = 3, delay = 15000, maxDelay = 60000, factor = 2) {
		return new Promise((resolve, reject) => {
			let currentDelay = delay;
			let currentAttempt = 0;
			const _accept = () => {
				offer.accept(false, (err, status) => {
					if (err) {
						this.emit('log', 'debug', `Offer failed to accept ${err}`);
						currentAttempt++;
						if (currentAttempt > retries) {
							this.emit('log', 'debug', `Maximum retries hit`);
							return reject(new Error("Maximum retries hit"));
						} else {
							currentDelay = currentAttempt > 1 ? (delay * factor) : delay;
							if (currentDelay > maxDelay) currentDelay = maxDelay;
							this.emit('log', 'debug', `Attempting to accept offer in ${currentDelay}`);
							setTimeout(() => _accept(), currentDelay);
						}
					} else {
						resolve(status);
					}
				});
			}
			_accept();
		});
	}

	/**
	 * @private
	 */
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