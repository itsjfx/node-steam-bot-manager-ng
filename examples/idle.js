const BotManager = require('../index.js');
const loginInfo = require('./config.js');

const botManager = new BotManager({
	cancelTime: null,
	loginRetryTime: 30,
	defaultConfirmationChecker: {},
	loginInterval: {
		time: 120,
		limit: 2
	}
});

const APPIDS = [570, 730, 240, 10];

// Displays the internal logging of the bot manager
botManager.on('log', (type, log) => {
	console.log(`${type} - ${log}`);
});

Promise.all(loginInfo.map(details => { // Promise to login all bots at once
	return botManager.addBot(details); // replace null with pollData if stored somewhere
}))
.then(bots => {
	console.log(`All ${bots.length} bots have been logged in`);
	console.log(bots[0].client);
	bots[0].client.setPersona(1)
	bots[0].client.gamesPlayed(APPIDS);
})
.catch(err => {
	console.log(`Error with bot manager`, err);
});