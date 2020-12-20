// Accepts a trade and sends the item it receives to another bot, repeatedly... Basically increases your trade made stat.
// This is a proof of concept, so no rate limiting is added, eventually Steam will block you but you should be able to get a couple of hundred trades in.

const BotManager = require('../lib/index.js');
const { ETradeOfferState, ETradeStatus } = require('steam-tradeoffer-manager');
const loginInfo = require('./config.js');

// Default values of the bot manager, except for the inventoryApi which is optional.
const botManager = new BotManager({
	cancelTime: null,
	loginRetryTime: 30,
	defaultConfirmationChecker: {},
	loginInterval: {
		time: 60,
		limit: 4,
	}
});

function retry(fn, retries=3, err=null) {
	if (!retries) {
		return Promise.reject(err);
	}
	return fn().catch(err => {
		return retry(fn, (retries - 1), err);
	});
}

// See the documentation for managerEvents in doc.md
const managerEvents = [
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
				console.log("Offer requires us to send items, ignoring");
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
					if (err) {
						return console.log(`Error getting exchange details: ${err}`);
					}

					// Create arrays of just the new assetids using Array.prototype.map and arrow functions
					let newReceivedItems = receivedItems.map(item => item.new_assetid);
					let newSentItems = sentItems.map(item => item.new_assetid);
					let itemsToSend = receivedItems.map(item => {
						return {
							assetid: item.new_assetid,
							appid: item.appid,
							contextid: item.contextid,
							//amount: item.amount ? item.amount : null
						}
					});
					console.log(`Received items: ${newReceivedItems.join(',')} - Sent Items: ${newSentItems.join(',')} - Status: ${ETradeStatus[status]}`);
					
					let receiveBot = botManager.bots.find(bot => bot.steamid != offer.manager.steamID);
					let newOffer = offer.manager.createOffer(receiveBot.steamid, receiveBot.loginInfo.tradeToken);
					newOffer.addMyItems(itemsToSend);
					retry(_sendOffer.bind(null, newOffer));

					function _sendOffer(o) {
						return new Promise((resolve, reject) => {
							o.send((err, status) => {
								if (err) {
									console.log(`Error sending new offer: ${err}`);
									return reject(true);
								}
								
								if (status == 'pending') {
									// We need to confirm it
									console.log(`Offer #${offer.id} sent, but requires confirmation`);
									offer.manager._community.acceptConfirmationForObject(botManager.botObjectFromIndex(botManager.botIndexFromSteamid(offer.manager.steamID.getSteamID64())).loginInfo.identity, newOffer.id, function(err) {
										if (err) {
											console.log(`Error confirming trade: ${err}`);
										} else {
											console.log("Offer confirmed");
										}
										resolve(true);
									});
								} else {
									console.log(`Offer #${offer.id} sent successfully`);
									resolve(true);
								}
							});
						});
					}
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