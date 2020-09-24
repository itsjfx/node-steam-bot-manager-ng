# node-steam-bot-manager-ng
[![npm version](https://img.shields.io/npm/v/steam-bot-manager-ng.svg)](https://npmjs.com/package/steam-bot-manager-ng) 

Small and simple module to manage multiple steam bots.

```
npm install steam-bot-manager-ng
```

## This project

My former forked version `steam-bot-manager-fork` of the original `steam-bot-manager` is no longer going to be maintained, however it will stay up for any old projects. This will be the new place for any new development. It didn't seem right to keep developing inside a fork so therefore `ng` (next generation) was appropriate.

This module is developed with the goal of simplifying the tasks of managing Steam bots. I have many tools which use Steam bots and having a dedicated manager for them seemed appropriate. The result is this module.

A list of changes from the former version [is available here](https://github.com/itsjfx/node-steam-bot-manager-ng#changes-from-the-fork-steam-bot-manager-fork-some-breaking-changes).

## Things it does nice

- The bot manager will gracefully keep any bots logged in if they are ever logged out
- Give you a bot object which is a simple interface with a `node-steam-tradeoffer-manager` instance, a `node-steam` instance and a `node-steamcommunity` instance
- Auto generate 2FA keys for login and any Steam Guard prompts if the login fails. For the case of an email code a prompt will display like `node-steam-user` does
- Easy confirmation polling configuration

Other than that it doesn't exactly bring any new features to a basic Steam bot setup as it imports (`node-steam-user`, `node-steamcommunity`, `node-steam-tradeoffer-manager`, `node-steam-totp`), the aim is just to make it easier to manage and use these modules.

## Documentation
Check [doc.md](https://github.com/itsjfx/node-steam-bot-manager-ng/blob/master/doc.md).

## Logging

To get any logging events just use something like below
```
botManager.on('log', (type, log) => {
	console.log(`${type} - ${log}`);
});
```
You can still hook onto any of the events from `node-steamcommunity` and `node-steam-user` by accessing them from the bot object. This event emitter is only for debug logging and not aimed as a substitute for any other events.

## What is this inventory api thing

It's an inventory api for Steam with some advanced features made by me called `node-steam-inventory-api-ng`. The repository [is available here](https://github.com/itsjfx/node-steam-inventory-api-ng). Ignore it if you don't want to use it as its use is entirely optional.

## Confirmation polling

Please read this to understand confirmation polling: https://github.com/DoctorMcKay/node-steamcommunity/wiki/Steam-Confirmation-Polling

**Note that confirmation polling has been marked as deprecated on `node-steamcommunity` and I expect it to be removed *soon***

It is recommended to use [`acceptConfirmationForObject`](https://github.com/DoctorMcKay/node-steamcommunity/wiki/SteamCommunity#acceptconfirmationforobjectidentitysecret-objectid-callback) instead as needed.

By default if nothing is set in the constructor for `defaultConfirmationChecker`, then confirmation polling will not be enabled by default. If `defaultConfirmationChecker` is set, then any bot which does not have a `confirmationChecker` property will use the `defaultConfirmationChecker` value.

The confirmation checker can be set individually for each bot by setting the `confirmationChecker` property for the bot when adding it. More info is in the [doc.md](https://github.com/itsjfx/node-steam-bot-manager-ng/blob/master/doc.md) file.

The `confirmationChecker` property should be set in the form:
```
{
	mode: "manual" or "auto",
	pollInterval: 10000
}
```

If you wish to disable confirmation checking for a bot despite having a default, set the `confirmationChecker` property to `false` or an empty object `{}`.

Modes

* `"manual"` means that the identity secret is not set for the confirmation checker, and so any new confirmation will fire a newConfirmation event for node-steamcommunity. This will let you do anything you want to the confirmation, meaning you can accept or decline it. If you're declining it's recommended to decline the offer in `node-steam-tradeoffer-manager`, instead of through the mobile authenticator as it is more reliable.

* `"auto"` means that the identity secret is set for the `confirmation checker, so any new confirmation will be accepted.

Despite it being a deprecated feature, it is still useful to have on small, low use tools to just auto accept. I personally like to use it on a long `pollInterval` and on `"manual"` mode so I can decline any trades at a mobile level that were not supposed to be sent out. `10000` is a recommended minimum amount for `pollInterval`, but at the end of the day the amount is up to you and your use case. If you have a lot of bots then obviously this amount needs to be scaled up.

## Changes from the fork (steam-bot-manager-fork) [SOME BREAKING CHANGES]

- Login retrying patched
- addBot takes different parameters now, as does the loginInfo options for the bot.
- Confirmation polling more configurable now
- Steam guard event changed to have a prompt now if it cannot generate a 2FA code
- Logging in event emitter instead of just going straight to console.log
- Code refactor
- Documentation
