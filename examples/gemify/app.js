const BotManager = require('../../lib/index.js');
const loginInfo = require('../config.js');
const getTag = require('./getTag.js');
const async = require('async');

const InventoryApi = require('steam-inventory-api-fork'); // Optional inventory API for the loadInventories call. Omit if you wish not to use.

const inventoryApi = Object.create(InventoryApi);

const GEM_WORKERS = 10; // How many workers we will have running making gems

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
	return botManager.loadInventories(753, 6, true);
})
.then(items => {
	const bot = botManager.bots[0];
	console.log(`${items.length} items found in the bot's inventories`);
	const inventory = items.filter((item) => (/*getTag(item, 'item_class').internal_name === 'item_class_4' || */getTag(item, 'item_class').internal_name === 'item_class_3')/* && getTag(item, 'Game').internal_name === 'app_1195670'*/);
	console.log("Filtered items:", inventory.length);
	/*
		item_class_4 - emote
		item_class_3 - background
	*/
	async.eachLimit(inventory, GEM_WORKERS, (item, callback) => {
		bot.community.getGemValue(item.market_fee_app, item.assetid, (err, res) => {
			if (err) {
				console.log(err);
				return callback();
			} else {
				const gemValue = res.gemValue;
				console.log(`Gem value ${gemValue} for item ${item.id} ${item.market_hash_name}`);
				if (!gemValue)
					return callback();

				bot.community.turnItemIntoGems(item.market_fee_app, item.assetid, gemValue, (err, res) => {
					if (err) {
						console.log("err", err);
					} else {
						console.log(res);
					}
					callback();
				}); //run request on URL
			}
		});
	}, (err) => {
		if (err) {
			return console.log(err);
		}
		console.log("Done");
	});
})
.catch(err => {
	console.log(`Error with bot manager`, err);
});