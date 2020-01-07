const BotManager = require('../index.js');
const loginInfo = require('./config.js');

const InventoryApi = require('steam-inventory-api-fork'); // Optional inventory API for the loadInventories call. Omit if you wish not to use.

const inventoryApi = Object.create(InventoryApi);

inventoryApi.init({
	id: 'Name of inventoryApi instance'
});

// Default values of the bot manager, except for the inventoryApi which is optional.
const botManager = new BotManager({
	cancelTime: null,
	inventoryApi: inventoryApi,
	loginRetryTime: 30,
	defaultConfirmationChecker: {}
});

// See the documentation for managerEvents in doc.md
const botEvents = [
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

Promise.all(loginInfo.map(details => { // Promise to login all bots at once
	// return botManager.addBot(details, details.type === 'storage' ? storageEvents : botEvents, null); // managerEvents can be set for each bot based on its type
	return botManager.addBot(details, botEvents, null); // replace null with pollData if stored somewhere
}))
.then(bots => {
	console.log(`All ${bots.length} bots have been logged in`);
	return botManager.loadInventories(730, 2, true);
})
.then(items => {
	console.log(`${items.length} items found in the bot's inventories`);
})
.catch(err => {
	console.log(`Error with bot manager`, err);
});