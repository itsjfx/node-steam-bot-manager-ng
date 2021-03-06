const BotManager = require('../lib/index.js');
const loginInfo = require('./config.js');

const InventoryApi = require('steam-inventory-api-ng'); // steam-inventory-api-ng must be installed

const inventoryApi = new InventoryApi();

const botManager = new BotManager({
	cancelTime: null,
	inventoryApi: inventoryApi,
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
	return botManager.loadInventories(730, 2, true);
})
.then((items) => {
	console.log(`${items.length} CS:GO tradable items found in the bot's inventories`);
})
.catch((err) => {
	console.log(`Error with bot manager`, err);
});
