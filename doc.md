<a name="BotManager"></a>

## BotManager ⇐ <code>EventEmitter</code>
Our BotManager, extends EventEmitter to have an in-built EventEmitter for logging under 'log'.

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [BotManager](#BotManager) ⇐ <code>EventEmitter</code>
    * [new BotManager([options])](#new_BotManager_new)
    * [.addBot(loginInfo, [managerEvents], [pollData])](#BotManager+addBot) ⇒ <code>Promise</code>
    * [.retryLogin(botIndex, timer)](#BotManager+retryLogin)
    * [.loadInventories(appid, contextid, tradableOnly)](#BotManager+loadInventories) ⇒ <code>Promise</code>
    * [.botIndexFromSteamid(steamid)](#BotManager+botIndexFromSteamid) ⇒ <code>number</code>
    * [.botSteamidFromIndex(botIndex)](#BotManager+botSteamidFromIndex) ⇒ <code>string</code>
    * [.botFromId(id)](#BotManager+botFromId) ⇒ <code>Object</code>
    * [.botFromAccountName(accountName)](#BotManager+botFromAccountName) ⇒ <code>Object</code>
    * [.botFromIndex(botIndex)](#BotManager+botFromIndex) ⇒ <code>Object</code>
    * [.botObjectFromId(id)](#BotManager+botObjectFromId) ⇒ <code>Object</code>
    * [.botObjectFromAccountName(accountName)](#BotManager+botObjectFromAccountName) ⇒ <code>Object</code>
    * [.numberOfBotsLoggedIn()](#BotManager+numberOfBotsLoggedIn) ⇒ <code>number</code>
    * [.numberOfBots()](#BotManager+numberOfBots) ⇒ <code>number</code>
    * [.botObjectFromIndex(botIndex)](#BotManager+botObjectFromIndex) ⇒ <code>Object</code>

<a name="new_BotManager_new"></a>

### new BotManager([options])
A Bot Manager instance


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | contains optional settings for the bot manager |
| [options.cancelTime] | <code>number</code> |  | cancelTime in ms that node-tradeoffer-manager will cancel an outgoing offer |
| [options.inventoryApi] | <code>Object</code> |  | steam-inventory-api-fork inventoryApi instance which is used in any inventory functions in the bot manager |
| [options.loginRetryTime] | <code>number</code> | <code>30</code> | retry time in seconds for how long we should wait before logging back into an account once being logged out |
| [options.defaultConfirmationChecker] | <code>Object</code> |  | settings for the default behaviour for confirmation checking. Omit if you do not want confirmation checking to be applied by default. https://github.com/DoctorMcKay/node-steamcommunity/wiki/Steam-Confirmation-Polling |
| [options.defaultConfirmationChecker.type] | <code>string</code> |  | "manual" or "auto" - manual will not have the identity secret passed into startConfirmationChecker, whereas auto will - and auto will accept any mobile confirmation. |
| [options.defaultConfirmationChecker.pollInterval] | <code>number</code> |  | the interval in ms for which it checks. 10000 is a safe amount and will avoid rate limiting. |

<a name="BotManager+addBot"></a>

### botManager.addBot(loginInfo, [managerEvents], [pollData]) ⇒ <code>Promise</code>
Adds a new bot to the bot manager.

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>Promise</code> - - Promise object which will resolve once the bot has successfully logged in for the first time. Returns the bot object which will contain the manager, community and client (and other things related to the bot). Rejects on the first login if something goes wrong.  

| Param | Type | Description |
| --- | --- | --- |
| loginInfo | <code>Object</code> | an object containing details for the logon - these are parsed into node-steam-user's logOn method, so read this documentation for more info: https://github.com/DoctorMcKay/node-steam-user#logondetails - the documentation below is what I use for steam bots |
| loginInfo.accountName | <code>string</code> | If logging into a user account, the account's name |
| loginInfo.password | <code>string</code> | If logging into an account without a login key or a web logon token, the account's password |
| [loginInfo.identity] | <code>string</code> \| <code>Buffer</code> | the identity_secret of the account - as a Buffer, hex string, or base64 string |
| [loginInfo.secret] | <code>string</code> \| <code>Buffer</code> | the shared_secret of the account - as Buffer, hex string, or base64 string |
| [loginInfo.type] | <code>string</code> | what type the bot will be, there can be multiple bots of the same type (e.g. storage) |
| [loginInfo.id] | <code>string</code> | a unique identifier for the bot in the case that in your code you want a way of mapping this type of bot for any accountName it gets changed to |
| [loginInfo.confirmationChecker] | <code>Object</code> | an object containing behaviour for the confirmation checker for this bot, just like the defaultConfirmationChecker object in the constructor |
| [loginInfo.confirmationChecker.type] | <code>string</code> | "manual" or "auto" - manual will not have the identity secret passed into startConfirmationChecker, whereas auto will - and auto will accept any mobile confirmation. |
| [loginInfo.confirmationChecker.pollInterval] | <code>number</code> | the interval in ms for which it checks. 10000 is a safe amount and will avoid rate limiting. |
| [managerEvents] | <code>Array.&lt;Object&gt;</code> | an array containing the node-steam-tradeoffer-manager events for the bot. https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#events - the mapping for the objects are below |
| [managerEvents[].name] | <code>string</code> | the name of the event, same as the events from node-steam-tradeoffer-manager |
| [managerEvents[].cb] | <code>string</code> | the function to be called. (e.g. for the newOffer event it would be cb: (offer) => {}) |
| [pollData] | <code>Object</code> | pollData for the bot that can be gracefully resumed. https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/Polling |

<a name="BotManager+retryLogin"></a>

### botManager.retryLogin(botIndex, timer)
Triggers the login for the bot, which is handled in the events in addBot. Used when initially logging in also.

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| botIndex | <code>number</code> |  | the index in the bots array for the bot we wish to relogin |
| timer | <code>number</code> | <code>0</code> | the time in ms we want to wait before we log the bot in |

<a name="BotManager+loadInventories"></a>

### botManager.loadInventories(appid, contextid, tradableOnly) ⇒ <code>Promise</code>
Loads all the inventories for the bots

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>Promise</code> - - Promise object containing all the inventories for the bots. The botIndex is contained in each item.  

| Param | Type | Description |
| --- | --- | --- |
| appid | <code>int</code> | The Steam application ID of the app |
| contextid | <code>int</code> | The ID of the context within the app you wish to retrieve |
| tradableOnly | <code>boolean</code> | True to get tradeable items only |

<a name="BotManager+botIndexFromSteamid"></a>

### botManager.botIndexFromSteamid(steamid) ⇒ <code>number</code>
Gets the botIndex for a given Steam ID

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>number</code> - - the index of the bot in the bots array  

| Param | Type | Description |
| --- | --- | --- |
| steamid | <code>string</code> | Steam ID of the bot |

<a name="BotManager+botSteamidFromIndex"></a>

### botManager.botSteamidFromIndex(botIndex) ⇒ <code>string</code>
Gets the Steam ID of a bot from the given botIndex

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>string</code> - - Steam ID of the bot  

| Param | Type | Description |
| --- | --- | --- |
| botIndex | <code>number</code> | the index of the bot in the bots array |

<a name="BotManager+botFromId"></a>

### botManager.botFromId(id) ⇒ <code>Object</code>
Gets the number of bot object for the bots id property (unique property)

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>Object</code> - - the bot object  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | the id of the bot |

<a name="BotManager+botFromAccountName"></a>

### botManager.botFromAccountName(accountName) ⇒ <code>Object</code>
Gets the number of bot object for a given accountName

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>Object</code> - - the bot object  

| Param | Type | Description |
| --- | --- | --- |
| accountName | <code>string</code> | the accountName for the bot |

<a name="BotManager+botFromIndex"></a>

### botManager.botFromIndex(botIndex) ⇒ <code>Object</code>
Gets the number of bot object for a given botIndex

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>Object</code> - - the bot object  

| Param | Type | Description |
| --- | --- | --- |
| botIndex | <code>number</code> | the index of the bot in the bots array |

<a name="BotManager+botObjectFromId"></a>

### botManager.botObjectFromId(id) ⇒ <code>Object</code>
Gets the number of bot object for the bots id property (unique property)

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>Object</code> - - the bot object  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | the id of the bot |

<a name="BotManager+botObjectFromAccountName"></a>

### botManager.botObjectFromAccountName(accountName) ⇒ <code>Object</code>
Gets the number of bot object for a given accountName

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>Object</code> - - the bot object  

| Param | Type | Description |
| --- | --- | --- |
| accountName | <code>string</code> | the accountName for the bot |

<a name="BotManager+numberOfBotsLoggedIn"></a>

### botManager.numberOfBotsLoggedIn() ⇒ <code>number</code>
Gets the number of bots logged in

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>number</code> - - the number of bots logged in  
<a name="BotManager+numberOfBots"></a>

### botManager.numberOfBots() ⇒ <code>number</code>
Gets the number of bots added to the bot manager

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>number</code> - - the number of bots added to the bot manager  
<a name="BotManager+botObjectFromIndex"></a>

### botManager.botObjectFromIndex(botIndex) ⇒ <code>Object</code>
Gets the number of bot object for a given botIndex

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>Object</code> - - the bot object  

| Param | Type | Description |
| --- | --- | --- |
| botIndex | <code>number</code> | the index of the bot in the bots array |

