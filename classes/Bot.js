const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');
const TradeOfferManager = require('steam-tradeoffer-manager');
const EventEmitter = require('events').EventEmitter;

/**
 * Our Bot, extends EventEmitter to have an in-built EventEmitter for logging under 'log'.
 * @class
 * @extends EventEmitter
 */
class Bot extends EventEmitter {
	constructor(loginInfo, options, botIndex, managerEvents, pollData) {
		super();
		// Bot vars
		this.loginInfo = loginInfo;
		this.apiKey = null;
		this.steamid = null;
		this.botIndex = botIndex;
		this.type = loginInfo.type;
		this.id = loginInfo.id;
		this.loggedIn = false;
		this.retryingLogin = false;
		this.initialLogin = true;
		this.options = options;

		// Create instances
		this.client = new SteamUser();
		this.community = new SteamCommunity();
		this.manager = new TradeOfferManager({
			steam: this.client,
			community: this.community,
			domain: 'localhost',
			cancelTime: options.cancelTime
		});

		if (pollData) {
			this.manager.pollData = pollData;
			this.emit('log', 'debug', 'Set pollData');
		}

		if (managerEvents) {
			managerEvents.forEach((event) => this.manager.on(event.name, event.cb));
			this.emit('log', 'debug', 'Set manager events: \n\t- ' + managerEvents.map((event) => event.name));
		}

		if (loginInfo.identity && !loginInfo.confirmationChecker) {
			this.emit('log', 'debug', `Using default confirmation checker settings for bot ${loginInfo.accountName}`);
			loginInfo.confirmationChecker = options.defaultConfirmationChecker;
		}

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
			this.emit('log', 'error', `Bot ${loginInfo.accountName}'s web session expired, retrying login in ${options.loginRetryTime} seconds`);
			this.emit('log', 'stack', err);
			this.loggedIn = false;
			this.retryLogin(options.loginRetryTime * 1000);
		});

		this.client.on('error', (err) => {
			this.emit('log', 'error', `Bot ${loginInfo.accountName} was logged out of Steam client, retrying login in ${options.loginRetryTime} seconds`);
			this.emit('log', 'stack', err);
			this.loggedIn = false;
			this.retryLogin(options.loginRetryTime * 1000);
		});

		if (this.loginInfo.shared) {
			this.client.on('steamGuard', (domain, callback) => {
				if (domain == null) { // An app code, we can generate it with 2FA
					this.emit('log', 'error', `2FA code failed, retrying in 30 seconds`);
					setTimeout(() => {
						callback(SteamTotp.getAuthCode(this.loginInfo.shared)); // 30 seconds is the max time for a 2FA code
					}, 30 * 1000);
				} else { // Taken from node-steam-user, if it's not an app code then it needs to be prompted. As we have a steamGuard listener the module will expect us to have a code for it
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

		this.retryLogin();
		this.emit('log', 'debug', `Added bot ${loginInfo.accountName}`);
	}

	/**
	 * Triggers the login for the bot, which is handled in the events in addBot. Used when initially logging in also.
	 * @param {number} timer - the time in ms we want to wait before we log the bot in
	 */
	login(timer = 0) {
		if (this.retryingLogin == true)
			return this.emit('log', 'error', `A login is already queued, blocking attempt`);

		this.retryingLogin = true;
		setTimeout(() => {
			let loginInfo = this.loginInfo;
			this.emit('log', 'debug', `Logging into ${loginInfo.accountName}`);
			if (loginInfo.shared)
				loginInfo.twoFactorCode = SteamTotp.getAuthCode(loginInfo.shared);

			this.retryingLogin = false; // Move the retry login here since we cannot handle all errors
			if (!this.client.steamID) { // If we need to log it into Steam
				this.emit('log', 'debug', `Logging into Steam Client`);
				this.client.logOn(loginInfo);
			} else { // We just need to refresh cookies, make a new webLogOn
				this.client.webLogOn();
			}
		}, timer);
	}

	/**
	 * Triggers the login for the bot, which is handled in the events in addBot. Used when initially logging in also.
	 * Alias of login
	 * @param {number} timer - the time in ms we want to wait before we log the bot in
	 */
	retryLogin(timer = 0) {
		this.login(timer);
	}

	_initialLogin() {
		return new Promise((resolve, reject) => {
			if (!this.initialLogin)
				return reject(new Error("Initial login call already executed for bot", this.loginInfo.accountName));

			this.client.on('loggedOn', (details) => {
				if (details.eresult !== 1 && this.initialLogin) {
					return reject(details);
				}
				this.steamid = this.client.steamID.getSteamID64();
			});

			this.client.on('webSession', (sessionID, cookies) => {
				let login = new Promise((resolve, reject) => {
					this.emit('log', 'debug', `Replacing web session`);
					this.community.setCookies(cookies);
					if (this.loginInfo.identity && this.loginInfo.confirmationChecker.type === 'manual') {
						this.community.startConfirmationChecker(this.loginInfo.confirmationChecker.pollInterval);
					} else if (this.loginInfo.identity && this.loginInfo.confirmationChecker.type === 'auto') {
						this.community.startConfirmationChecker(this.loginInfo.confirmationChecker.pollInterval, this.loginInfo.identity);
					}
					this.manager.setCookies(cookies, (err) => {
						if (err)
							return reject(err);
						this.apiKey = this.manager.apiKey;
						this.loggedIn = true;
						//this.retryingLogin = false;
						resolve(this.botIndex);
					});
				});

				login
				.catch((err) => {
					this.emit('log', 'error', `Error logging back in, retrying in ${this.options.loginRetryTime} seconds`);
					this.emit('log', 'stack', err);
					this.retryLogin(this.options.loginRetryTime * 1000);
				})
				.then((res) => {
					this.emit('log', 'debug', `Bot ${this.loginInfo.accountName} logged in`);
					if (this.initialLogin) {
						this.initialLogin = false;
						resolve(this); // If it was our first login, we resolve the call once it's logged in the first time
					}
				});
			});
		});
	}
}

module.exports = Bot;