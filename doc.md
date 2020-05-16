## Classes

<dl>
<dt><a href="#BotManager">BotManager</a> ⇐ <code>EventEmitter</code></dt>
<dd><p>Our BotManager, extends EventEmitter to have an in-built EventEmitter for logging under &#39;log&#39;.</p>
</dd>
<dt><a href="#Bot">Bot</a> ⇐ <code>EventEmitter</code></dt>
<dd><p>Our Bot, extends EventEmitter to have an in-built EventEmitter for logging under &#39;log&#39;.</p>
</dd>
</dl>

<a name="BotManager"></a>

## BotManager ⇐ <code>EventEmitter</code>
Our BotManager, extends EventEmitter to have an in-built EventEmitter for logging under 'log'.

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [BotManager](#BotManager) ⇐ <code>EventEmitter</code>
    * [new BotManager([options])](#new_BotManager_new)
    * [.addBot(loginInfo, [managerEvents], [pollData])](#BotManager+addBot) ⇒ <code>Promise</code>
    * [.retryLogin(botIndex, timer)](#BotManager+retryLogin)
    * [.login(botIndex, timer)](#BotManager+login)
    * [.loadInventories(appid, contextid, tradableOnly)](#BotManager+loadInventories) ⇒ <code>Promise</code>
    * [.botIndexFromSteamid(steamid)](#BotManager+botIndexFromSteamid) ⇒ <code>number</code>
    * [.botSteamidFromIndex(botIndex)](#BotManager+botSteamidFromIndex) ⇒ <code>string</code>
    * [.botFromId(id)](#BotManager+botFromId) ⇒ [<code>Bot</code>](#Bot)
    * [.botFromSteamId(steamid)](#BotManager+botFromSteamId) ⇒ [<code>Bot</code>](#Bot)
    * [.botObjectFromSteamId(steamid)](#BotManager+botObjectFromSteamId) ⇒ [<code>Bot</code>](#Bot)
    * [.botFromAccountName(accountName)](#BotManager+botFromAccountName) ⇒ [<code>Bot</code>](#Bot)
    * [.botFromIndex(botIndex)](#BotManager+botFromIndex) ⇒ [<code>Bot</code>](#Bot)
    * [.botObjectFromId(id)](#BotManager+botObjectFromId) ⇒ [<code>Bot</code>](#Bot)
    * [.botObjectFromAccountName(accountName)](#BotManager+botObjectFromAccountName) ⇒ [<code>Bot</code>](#Bot)
    * [.numberOfBots()](#BotManager+numberOfBots) ⇒ <code>number</code>
    * [.botObjectFromIndex(botIndex)](#BotManager+botObjectFromIndex) ⇒ [<code>Bot</code>](#Bot)
    * [.getBotsByType(type)](#BotManager+getBotsByType) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
    * [.getBotsBySubtype(type)](#BotManager+getBotsBySubtype) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
    * [.getBotByType(type)](#BotManager+getBotByType) ⇒ [<code>Bot</code>](#Bot)
    * [.getBotBySubtype(subtype)](#BotManager+getBotBySubtype) ⇒ [<code>Bot</code>](#Bot)

<a name="new_BotManager_new"></a>

### new BotManager([options])
A Bot Manager instance


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | contains optional settings for the bot manager |
| [options.cancelTime] | <code>number</code> |  | cancelTime in ms that node-tradeoffer-manager will cancel an outgoing offer |
| [options.inventoryApi] | <code>Object</code> |  | steam-inventory-api-ng inventoryApi instance which is used in any inventory functions in the bot manager |
| [options.loginRetryTime] | <code>number</code> | <code>30</code> | retry time in seconds for how long we should wait before logging back into an account once being logged out |
| [options.defaultConfirmationChecker] | <code>Object</code> |  | settings for the default behaviour for confirmation checking. Omit if you do not want confirmation checking to be applied by default. https://github.com/DoctorMcKay/node-steamcommunity/wiki/Steam-Confirmation-Polling |
| [options.defaultConfirmationChecker.type] | <code>string</code> |  | "manual" or "auto" - manual will not have the identity secret passed into startConfirmationChecker, whereas auto will - and auto will accept any mobile confirmation. |
| [options.defaultConfirmationChecker.pollInterval] | <code>number</code> |  | the interval in ms for which it checks. 10000 is a safe amount and will avoid rate limiting. |
| [options.loginInterval] | <code>Object</code> |  | an object containing login interval settings |
| [options.loginInterval.time] | <code>number</code> |  | time in seconds for the interval to last |
| [options.loginInterval.limit] | <code>number</code> |  | the number of logins we can make in this interval before we start blocking |
| [options.assetSettings] | <code>Object</code> |  | asset settings which are parsed into the constructor for steam-tradeoffer-manager |
| [options.assetSettings.language] | <code>string</code> |  | which language will be used for item descriptions |
| [options.assetSettings.globalAssetCache] | <code>boolean</code> |  | see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#globalassetcache |
| [options.assetSettings.assetCacheMaxItems] | <code>number</code> |  | see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#assetcachemaxitems |
| [options.assetSettings.assetCacheGcInterval] | <code>number</code> |  | see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#assetcachegcinterval |
| [options.assetSettings.dataDirectory] | <code>string</code> |  | see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#datadirectory |

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
| [loginInfo.subtype] | <code>string</code> | what subtype the bot will be, there can be multiple bots of the same subtype. |
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
Alias of login

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| botIndex | <code>number</code> |  | the index in the bots array for the bot we wish to relogin |
| timer | <code>number</code> | <code>0</code> | the time in ms we want to wait before we log the bot in |

<a name="BotManager+login"></a>

### botManager.login(botIndex, timer)
Triggers the login for a bot, which is handled in the events in addBot. Used when initially logging in also.

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

### botManager.botFromId(id) ⇒ [<code>Bot</code>](#Bot)
Gets the number of bot object for the bots id property (unique property)

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Bot</code>](#Bot) - - the bot object  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | the id of the bot |

<a name="BotManager+botFromSteamId"></a>

### botManager.botFromSteamId(steamid) ⇒ [<code>Bot</code>](#Bot)
Gets the number of bot object for the bots id property (unique property)

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Bot</code>](#Bot) - - the bot object  

| Param | Type | Description |
| --- | --- | --- |
| steamid | <code>string</code> | the steamid of the bot |

<a name="BotManager+botObjectFromSteamId"></a>

### botManager.botObjectFromSteamId(steamid) ⇒ [<code>Bot</code>](#Bot)
Gets the number of bot object for the bots id property (unique property)

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Bot</code>](#Bot) - - the bot object  

| Param | Type | Description |
| --- | --- | --- |
| steamid | <code>string</code> | the steamid of the bot |

<a name="BotManager+botFromAccountName"></a>

### botManager.botFromAccountName(accountName) ⇒ [<code>Bot</code>](#Bot)
Gets the number of bot object for a given accountName

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Bot</code>](#Bot) - - the bot object  

| Param | Type | Description |
| --- | --- | --- |
| accountName | <code>string</code> | the accountName for the bot |

<a name="BotManager+botFromIndex"></a>

### botManager.botFromIndex(botIndex) ⇒ [<code>Bot</code>](#Bot)
Gets the number of bot object for a given botIndex

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Bot</code>](#Bot) - - the bot object  

| Param | Type | Description |
| --- | --- | --- |
| botIndex | <code>number</code> | the index of the bot in the bots array |

<a name="BotManager+botObjectFromId"></a>

### botManager.botObjectFromId(id) ⇒ [<code>Bot</code>](#Bot)
Gets the number of bot object for the bots id property (unique property)

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Bot</code>](#Bot) - - the bot object  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | the id of the bot |

<a name="BotManager+botObjectFromAccountName"></a>

### botManager.botObjectFromAccountName(accountName) ⇒ [<code>Bot</code>](#Bot)
Gets the number of bot object for a given accountName

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Bot</code>](#Bot) - - the bot object  

| Param | Type | Description |
| --- | --- | --- |
| accountName | <code>string</code> | the accountName for the bot |

<a name="BotManager+numberOfBots"></a>

### botManager.numberOfBots() ⇒ <code>number</code>
Gets the number of bots added to the bot manager

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>number</code> - - the number of bots added to the bot manager  
<a name="BotManager+botObjectFromIndex"></a>

### botManager.botObjectFromIndex(botIndex) ⇒ [<code>Bot</code>](#Bot)
Gets the number of bot object for a given botIndex

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Bot</code>](#Bot) - - the bot object  

| Param | Type | Description |
| --- | --- | --- |
| botIndex | <code>number</code> | the index of the bot in the bots array |

<a name="BotManager+getBotsByType"></a>

### botManager.getBotsByType(type) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
Gets a list of bots filtered by a type

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Array.&lt;Bot&gt;</code>](#Bot) - - the bot objects  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | the desired type |

<a name="BotManager+getBotsBySubtype"></a>

### botManager.getBotsBySubtype(type) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
Gets a list of bots filtered by a type

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Array.&lt;Bot&gt;</code>](#Bot) - - the bot objects  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | the desired type |

<a name="BotManager+getBotByType"></a>

### botManager.getBotByType(type) ⇒ [<code>Bot</code>](#Bot)
Gets a bot by a type by rotating through the filtered bots.

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Bot</code>](#Bot) - - the bot  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | the desired type |

<a name="BotManager+getBotBySubtype"></a>

### botManager.getBotBySubtype(subtype) ⇒ [<code>Bot</code>](#Bot)
Gets a bot by a subtype by rotating through the filtered bots.

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Bot</code>](#Bot) - - the bot  

| Param | Type | Description |
| --- | --- | --- |
| subtype | <code>String</code> | the desired subtype |

<a name="Bot"></a>

## Bot ⇐ <code>EventEmitter</code>
Our Bot, extends EventEmitter to have an in-built EventEmitter for logging under 'log'.

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [Bot](#Bot) ⇐ <code>EventEmitter</code>
    * [.login(timer)](#Bot+login)
    * [.retryLogin(timer)](#Bot+retryLogin)
    * [.communityLoggedIn()](#Bot+communityLoggedIn) ⇒ <code>Promise</code>
    * [.loggedIn()](#Bot+loggedIn) ⇒ <code>Promise</code>

<a name="Bot+login"></a>

### bot.login(timer)
Triggers the login for the bot, which is handled in the events in addBot. Used when initially logging in also.

**Kind**: instance method of [<code>Bot</code>](#Bot)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| timer | <code>number</code> | <code>0</code> | the time in ms we want to wait before we log the bot in |

<a name="Bot+retryLogin"></a>

### bot.retryLogin(timer)
Triggers the login for the bot, which is handled in the events in addBot. Used when initially logging in also.Alias of login

**Kind**: instance method of [<code>Bot</code>](#Bot)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| timer | <code>number</code> | <code>0</code> | the time in ms we want to wait before we log the bot in |

<a name="Bot+communityLoggedIn"></a>

### bot.communityLoggedIn() ⇒ <code>Promise</code>
Gets the bots logged in state for steamcommunity (web session), async because of the node-steamcommunity call

**Kind**: instance method of [<code>Bot</code>](#Bot)  
**Returns**: <code>Promise</code> - - Resolves true if true, rejects an error if not  
<a name="Bot+loggedIn"></a>

### bot.loggedIn() ⇒ <code>Promise</code>
Gets the bots logged in state, async because of the node-steamcommunity call

**Kind**: instance method of [<code>Bot</code>](#Bot)  
**Returns**: <code>Promise</code> - - Resolves if both community and client are logged in, rejects with a response as to which are logged out if one is logged out  
