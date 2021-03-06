const BotManager = require('../lib/index.js');
const loginInfo = require('./config.js');

// Default values of the bot manager, except for the inventoryApi which is optional.
const botManager = new BotManager({
	cancelTime: null,
	loginRetryTime: 30,
	defaultConfirmationChecker: {},
	loginInterval: {
		time: 60,
		limit: 4,
	},
});

// See the documentation for managerEvents in doc.md
const managerEvents = [
	{
		name: 'newOffer',
		cb: (offer) => {
			console.log('Received a new offer');
			//offer.decline();
		}
	}
];

// Displays the internal logging of the bot manager
botManager.on('log', (type, log) => {
	console.log(`${type} - ${log}`);
});

Promise.all(loginInfo.map((details) => { // Promise to login all bots at once
	let bot = botManager.addBot(details, {
		managerEvents,
	});
	return bot.login();
}))
.then((bots) => {
	console.log(`All ${bots.length} bots have been logged in`);
})
.catch((err) => {
	console.log(`Error with bot manager`, err);
});
