const BotManager = require('../lib/index.js');
const loginInfo = require('./config.js');
const { EPersonaState } = require('steam-user');

const botManager = new BotManager({
	cancelTime: null,
	loginRetryTime: 30,
	defaultConfirmationChecker: {},
	loginInterval: {
		time: 60,
		limit: 4,
	}
});

const APPIDS = [570, 730, 240, 10];

// Displays the internal logging of the bot manager
botManager.on('log', (type, log) => {
	console.log(`${type} - ${log}`);
});

Promise.all(loginInfo.map(details => { // Promise to login all bots at once
	let bot = botManager.addBot(details);
	return bot.login();
}))
.then((bots) => {
	console.log(`All ${bots.length} bots have been logged in`);
	bots.forEach((bot) => {
		bot.client.setPersona(EPersonaState.Online)
		bot.client.gamesPlayed(APPIDS);
	});
})
.catch((err) => {
	console.log(`Error with bot manager`, err);
});