const EventEmitter = require('events').EventEmitter;

const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');
const TradeOfferManager = require('steam-tradeoffer-manager');
const Request = require('request');

const EXPONENTIAL_LOGIN_BACKOFF_MAX = 60000;
const DEFAULT_LOGIN_DELAY = 1000;

/**
 * Our Bot, extends EventEmitter to have an in-built EventEmitter for logging under 'log'.
 * For documentation on this constructor see addBot in the bot manager.
 * loginInfo is generally set in the config of the bot, whereas options is done by the code adding the bot (e.g. reading from DB, getting pollData)
 * @class
 * @extends EventEmitter
 */
class Bot extends EventEmitter {
	constructor(botManager, loginInfo, options) {
		super();
		// Bot vars
		this.loginInfo = loginInfo;
		this.apiKey = null;
		this.steamid = null;
		this.botIndex = botManager.bots.length;
		this.type = loginInfo.type;
		this.subtype = loginInfo.subtype;
		this.id = loginInfo.id;
		this.retryingLogin = false;
		this.initialLogin = true;

		this.botManager = botManager;

		// Create instances
		this.client = new SteamUser({
			httpProxy: loginInfo.httpProxy
		});
		if (loginInfo.httpProxy) {
			this.community = new SteamCommunity({
				request: Request.defaults({
					proxy: loginInfo.httpProxy
				})
			});
		} else {
			this.community = new SteamCommunity();
		}
		this.manager = new TradeOfferManager({
			steam: this.client,
			community: this.community,
			domain: 'localhost',
			cancelTime: botManager.options.cancelTime,
			language: botManager.options.assetSettings.language,
			globalAssetCache: (options.assetSettings && options.assetSettings.globalAssetCache) || botManager.options.assetSettings.globalAssetCache,
			assetCacheMaxItems: (options.assetSettings && options.assetSettings.assetCacheMaxItems) || botManager.options.assetSettings.assetCacheMaxItems,
			assetCacheGcInterval: (options.assetSettings && options.assetSettings.assetCacheGcInterval) || botManager.options.assetSettings.assetCacheGcInterval,
			dataDirectory: (options.assetSettings && options.assetSettings.dataDirectory) || botManager.options.assetSettings.dataDirectory,
		});

		// Resume pollData if it is given
		if (options.pollData) {
			this.manager.pollData = options.pollData;
			this.emit('log', 'debug', 'Set pollData');
		}

		// Set manager events if they are given
		if (options.managerEvents) {
			options.managerEvents.forEach((event) => this.manager.on(event.name, event.cb));
			this.emit('log', 'debug', 'Set manager events: \n\t- ' + options.managerEvents.map((event) => event.name));
		}

		// If the confirmation checker is false for a bot, we assume they want it disabled
		if (loginInfo.confirmationChecker === false) {
			loginInfo.confirmationChecker = {};
		}

		// Set the confirmation checker settings to the bot managers if we are not overriding for this bot
		if (loginInfo.identity && !loginInfo.confirmationChecker) {
			this.emit('log', 'debug', `Using default confirmation checker settings for bot ${loginInfo.accountName}`);
			loginInfo.confirmationChecker = botManager.options.defaultConfirmationChecker;
		}

		// Add the confKeyNeeded event if we using manual mode
		if (loginInfo.identity && loginInfo.confirmationChecker.type === 'manual') {
			this.community.on('confKeyNeeded', (tag, callback) => {
				// Disabling this as this call never gets called, since we can reuse details
				/*if (tag == 'details') { // Block details calls so we don't make an extra request for getting the offer ID when we can determine it from creator and type property (not working)
					callback(new Error("Disabled"));
				}*/
				let time = SteamTotp.time();
				callback(null, time, SteamTotp.getConfirmationKey(loginInfo.identity, time, tag));
			});
		}

		this.community.on('sessionExpired', (err) => {
			this.emit('log', 'stack', err);
			if (this.clientLoggedIn()) {
				this.emit('log', 'error', `Bot ${loginInfo.accountName}'s web session expired. Retrying.`);
				this.login();
			} else {
				this.emit('log', 'error', `Bot ${loginInfo.accountName}'s web session expired. Not retrying, client logged out.`);
			}
		});

		this.client.on('error', (err) => {
			this.emit('log', 'error', `Bot ${loginInfo.accountName} was logged out of Steam client.`);
			this.emit('log', 'stack', err);
			this.login();
		});

		if (this.loginInfo.shared) {
			this.client.on('steamGuard', (domain, callback) => {
				if (domain == null) { // An app code, we can generate it with 2FA
					this.emit('log', 'error', `2FA code failed, retrying in 30 seconds`);
					setTimeout(() => {
						callback(SteamTotp.getAuthCode(this.loginInfo.shared)); // 30 seconds is the max time for a 2FA code
					}, 30 * 1000);
				} else {
					// Taken from node-steam-user, if it's not an app code then it needs to be prompted.
					// As we have a steamGuard listener the module will expect us to have a code for it
					let rl = require('readline').createInterface({
						"input": process.stdin,
						"output": process.stdout
					});
			
					rl.question('Steam Guard Code: ', (code) => {
						rl.close();
						callback(code);
					});
				}
			});
		}

		this.emit('log', 'debug', `Added bot ${loginInfo.accountName}`);
		return this;
	}

	/**
	 * Triggers the login for the bot, which is handled in the events in addBot. Used when initially logging in also.
	 */
	login() {
		if (this.retryingLogin == true) {
			return this.emit('log', 'error', `A login is already queued, blocking attempt`);
		}

		if (!this.initialLogin) {
			if (this.botManager.recentLogins >= this.botManager.options.loginInterval.limit) {
				return this.emit('log', 'error', `Maximum of logins hit for interval, blocking attempt`);
			}

			this.botManager.recentLogins++;
		}

		this.retryingLogin = true;
		let timer = this._loginTimeoutDuration || DEFAULT_LOGIN_DELAY;
		this._loginTimeoutDuration = Math.min(timer * 2, EXPONENTIAL_LOGIN_BACKOFF_MAX); // Exponential backoff, factor of 2

		setTimeout(() => {
			let loginInfo = this.loginInfo;
			this.emit('log', 'info', `Logging into ${loginInfo.accountName}`);
			if (loginInfo.shared) {
				loginInfo.twoFactorCode = SteamTotp.getAuthCode(loginInfo.shared);
			}

			this.retryingLogin = false; // Move the retry login here since we cannot handle all errors
			if (!this.clientLoggedIn()) { // If we need to log it into Steam
				this.emit('log', 'debug', `Logging into Steam Client`);
				this.client.logOn(loginInfo);
			} else { // Check if we need to login into steamcommunity
				this.communityLoggedIn()
				.then(() => {
					this.emit('log', 'debug', 'Bot is logged in, not refreshing login');
				})
				.catch(() => {
					this.emit('log', 'debug', `Requesting web session`);
					this.client.webLogOn();
				})
			}
		}, this._loginTimeoutDuration);

		// Return a promise as to whether or not the bot has logged in if it's the first time calling login
		if (this.initialLogin) {
			return this._initialLogin();
		}
	}

	/**
	 * Triggers the login for the bot, which is handled in the events in addBot. Used when initially logging in also.
	 * Alias of login.
	 */
	retryLogin() {
		return this.login();
	}

	/**
	 * Gets the bots logged in state for steamcommunity (web session), async because of the node-steamcommunity call
	 * @returns {Promise} - Resolves true if true, rejects an error if not
	 */
	communityLoggedIn() {
		return new Promise((resolve, reject) => {
			this.community.loggedIn((err, loggedIn, familyView) => {
				if (loggedIn) {
					return resolve(true);
				} else {
					return reject(new Error("Not logged in"));
				}
			});
		});
	}

	/**
	 * Gets the bots logged in state for the Steam client (node-steam-user)
	 * @returns {Boolean} - Returns true if logged in, false if not
	 */
	clientLoggedIn() {
		return !!this.client.steamID && !!this.client.publicIP;
	}

	/**
	 * Gets the bots logged in state, async because of the node-steamcommunity call
	 * @returns {Promise} - Resolves if both community and client are logged in, rejects with a response as to which are logged out if one is logged out
	 */
	loggedIn() {
		return new Promise(async (resolve, reject) => {
			const clientStatus = this.clientLoggedIn();
			let communityStatus
			try {
				communityStatus = await this.communityLoggedIn();
			} catch {
				communityStatus = false;
			}
			if (!communityStatus || !clientStatus) {
				return reject({
					client: clientStatus,
					community: communityStatus,
				});
			}
			resolve(true);
		});
	}

	_initialLogin() {
		return new Promise((resolve, reject) => {
			if (!this.initialLogin) {
				return reject(new Error("Initial login call already executed for bot " + this.loginInfo.accountName));
			}

			// Only reject an error if it fails on the first login
			this.client.on('loggedOn', (details) => {
				if (details.eresult !== SteamUser.EResult.OK) {
					this.emit('log', 'error', `EResult in loggedOn was not OK`);
					if (this.initialLogin) {
						return reject(details);
					} else {
						return;
					}
				}
				this.steamid = this.client.steamID.getSteamID64();
				//delete this._loginTimeoutDuration;
			});

			this.client.on('webSession', (sessionID, cookies) => {
				this.emit('log', 'debug', `Replacing web session`);

				// Set the cookies for community
				this.community.setCookies(cookies);

				// Start confirmation checker again now that we have our web session
				if (this.loginInfo.identity && this.loginInfo.confirmationChecker.type === 'manual') {
					this.community.startConfirmationChecker(this.loginInfo.confirmationChecker.pollInterval);
				} else if (this.loginInfo.identity && this.loginInfo.confirmationChecker.type === 'auto') {
					this.community.startConfirmationChecker(this.loginInfo.confirmationChecker.pollInterval, this.loginInfo.identity);
				}

				// Set cookies for our trade manager
				this.manager.setCookies(cookies, (err) => {
					if (err) {
						this.emit('log', 'error', `Error replacing cookies for manager`);
						this.emit('log', 'stack', err);
						if (this.initialLogin) {
							return reject(err);
						}
						// Retry
						return this.login();
					}
					delete this._loginTimeoutDuration; // Reset our login backoff
					this.apiKey = this.manager.apiKey;

					// We are logged in now that our cookies are set
					this.emit('log', 'info', `Bot ${this.loginInfo.accountName} logged in`);
					if (this.initialLogin) {
						this.initialLogin = false;
						resolve(this); // Resolve the bot on the first login
					}
				});
			});
		});
	}
}

module.exports = Bot;