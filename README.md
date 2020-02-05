# node-steam-bot-manager-ng
[![npm version](https://img.shields.io/npm/v/steam-bot-manager-ng.svg)](https://npmjs.com/package/steam-bot-manager-ng) 

Small and simple module to manage multiple steam bots.

```
npm install steam-bot-manager-ng
```

## This project

My former forked version (steam-bot-manager-fork) of the original steam-bot-manager is no longer going to be maintained, however it will stay up for any old projects. This will be the new place for any new development. It didn't seem right to keep developing inside a fork so therefore ng (next generation) was appropriate.

This module is developed with the goal of simplifying the tasks of managing steam bots. I have many tools which use steam bots and it was tiresome to copy and paste code across other tools when I could just have a centralised tool to do so.

## Changes from the fork (steam-bot-manager-fork) [SOME BREAKING CHANGES]

- Login retrying patched
- addBot takes different parameters now, as does the loginInfo options for the bot.
- Confirmation polling more configurable now
- Steam guard event changed to have a prompt now if it cannot generate a 2FA code
- Logging in event emitter instead of just going straight to console.log
- Code refactor
- Documentation

## Things it does nice

- The bot manager will aggressively keep any bots logged in if they are ever logged out.
- Auto generate 2FA keys for login and also any steam guard prompts if the login fails. If it is not a 2FA code and instead an email code it will ask for a prompt like node-steam-user does.
- Make it easier to manage confirmation polling
- Handle all the login logic with Steam


Other than that it doesn't exactly bring any new features to a basic steam bot setup as it imports (node-steam-user, node-steamcommunity, node-steam-tradeoffer-manager, node-steam-totp), the aim is just in making it easier to use these modules.

## Logging

To get any logging events just use something like below
```
botManager.on('log', (type, log) => {
	console.log(`${type} - ${log}`);
});
```
You can still hook onto any of the events from node-steamcommunity and node-steam-user by accessing them from the bot object. This event emitter was only supposed to be for logging and not supposed to replace anything internally.

## What is this inventory api thing

It's an inventory api for Steam with some advanced features. Link here: https://github.com/itsjfx/node-steam-inventory-api-ng Ignore it if you don't want to use it as it is entirely optional.

## Confirmation polling

Read this to understand confirmation polling: https://github.com/DoctorMcKay/node-steamcommunity/wiki/Steam-Confirmation-Polling

By default if nothing is set in the constructor for defaultConfirmationChecker then confirmation polling will not be enabled by default. If defaultConfirmationChecker is set, then any bot which does not have a confirmationChecker property will use the defaultConfirmationChecker value.

The confirmation checker can also be set individually for each bot by setting the confirmationChecker property for the bot when adding it. More info is in the doc.md file - however the confirmationChecker property will be {mode: "manual" or "auto", pollInterval: 10000} for example. If you wish to disable confirmation checking for a bot despite having a default set, set the confirmationChecker property to an empty object {}.

"manual" means that the identity secret is not set for the confirmationChecker, and so any new confirmation will fire a newConfirmation event for node-steamcommunity. This will let you do anything you want to the confirmation - and you can accept or decline it (however if declining it's recommended to just decline the offer, and not in the mobile authenticator).

"auto" means that the identity secret is set for the confirmationChecker, and so any new confirmation will just be accepted.

Despite it being a depreciated feature, it is still useful to have on small tools to just auto accept everything. I personally like to use it on a long pollInterval and on manual mode so I can decline any trades at a mobile level that were not supposed to be sent out. 10000 is a recommended minimum amount for pollInterval, but at the end of the day the amount is up to you and your use case, if you have a lot of bots then obviously this amount needs to be scaled up.