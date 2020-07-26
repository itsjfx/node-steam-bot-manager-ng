const BotManager = require('../lib/index.js');
const { ETradeOfferState, ETradeStatus } = require('steam-tradeoffer-manager');
const loginInfo = require('./config.js');

// Default values of the bot manager, except for the inventoryApi which is optional.
const botManager = new BotManager({
	cancelTime: null,
	loginRetryTime: 30,
	defaultConfirmationChecker: {},
	loginInterval: {
		time: 120,
		limit: 1
	}
});

// See the documentation for managerEvents in doc.md
const botEvents = [
	{
		name: 'newOffer',
		cb: (offer) => {
			console.log('Received a new offer');
			if (offer.itemsToReceive.length > 0 && offer.itemsToGive.length == 0) {
				console.log("Accepting offer...")
				offer.accept(function(err, status) {
					if (err) {
						console.log("Unable to accept offer: " + err.message);
					} else {
						console.log("Offer accepted: " + status);
					}
				});
			} else {
				console.log("Offer requires us to send items, ignoring")
			}
		}
	},
	{
		name: 'receivedOfferChanged',
		cb: (offer, oldState) => {
			const oldStateStr = oldState ? ETradeOfferState[oldState] : "N/A";
			const state = ETradeOfferState[offer.state];
			console.log(`Offer #${offer.id} changed: ${oldStateStr} -> ${state}`);

			if (state == "Accepted") {
				offer.getExchangeDetails((err, status, tradeInitTime, receivedItems, sentItems) => {
					if (err)
						return console.log(`Error getting exchange details: ${err}`);

					// Create arrays of just the new assetids using Array.prototype.map and arrow functions
					let newReceivedItems = receivedItems.map(item => item.new_assetid);
					let newSentItems = sentItems.map(item => item.new_assetid);

					console.log(`Received items: ${newReceivedItems.join(',')} - Sent Items: ${newSentItems.join(',')} - Status: ${ETradeStatus[status]}`);
				});
			}
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
})
.catch(err => {
	console.log(`Error with bot manager`, err);
});