## Classes

<dl>
<dt><a href="#BotManager">BotManager</a> ⇐ <code>EventEmitter</code></dt>
<dd><p>Our BotManager, extends EventEmitter to have an in-built EventEmitter for logging under &#39;log&#39;.</p>
</dd>
<dt><a href="#Bot">Bot</a> ⇐ <code>EventEmitter</code></dt>
<dd><p>Our Bot, extends EventEmitter to have an in-built EventEmitter for logging under &#39;log&#39;.
For documentation on this constructor see addBot in the bot manager.
loginInfo is generally set in the config of the bot, whereas options is done by the code adding the bot (e.g. reading from DB, getting pollData)</p>
</dd>
</dl>

<a name="BotManager"></a>

## BotManager ⇐ <code>EventEmitter</code>
Our BotManager, extends EventEmitter to have an in-built EventEmitter for logging under 'log'.

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [BotManager](#BotManager) ⇐ <code>EventEmitter</code>
    * [new BotManager([options])](#new_BotManager_new)
    * [.addBot(loginInfo, options)](#BotManager+addBot) ⇒ <code>Promise</code>
    * [.addBots(bots)](#BotManager+addBots) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
    * [.addAndLoginToBot(loginInfo, [options])](#BotManager+addAndLoginToBot) ⇒ <code>Promise</code>
    * [.addAndLoginToBots(bots)](#BotManager+addAndLoginToBots) ⇒ <code>Promise</code>
    * [.retryLogin(botIndex)](#BotManager+retryLogin)
    * [.login(botIndex)](#BotManager+login)
    * [.loadInventories(appid, contextid, tradableOnly, [retries], [language])](#BotManager+loadInventories) ⇒ <code>Promise</code>
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
    * [.getBotsByTypes(types)](#BotManager+getBotsByTypes) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
    * [.getBotsBySubtype(subtype)](#BotManager+getBotsBySubtype) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
    * [.getBotsBySubtypeOnly(subtype)](#BotManager+getBotsBySubtypeOnly) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
    * [.getBotByType(type)](#BotManager+getBotByType) ⇒ [<code>Bot</code>](#Bot)
    * [.getBotBySubtype(type, subtype)](#BotManager+getBotBySubtype) ⇒ [<code>Bot</code>](#Bot)
    * [.acceptOffer(offer, [retries], [delay], [maxDelay], [factor])](#BotManager+acceptOffer)

<a name="new_BotManager_new"></a>

### new BotManager([options])
A Bot Manager instance


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | contains optional settings for the bot manager |
| [options.cancelTime] | <code>number</code> |  | cancelTime in ms that node-tradeoffer-manager will cancel an outgoing offer |
| [options.inventoryApi] | <code>Object</code> |  | steam-inventory-api-ng inventoryApi instance which is used in any inventory functions in the bot manager |
| [options.defaultConfirmationChecker] | <code>Object</code> |  | settings for the default behaviour for confirmation checking. Omit if you do not want confirmation checking to be applied by default. https://github.com/DoctorMcKay/node-steamcommunity/wiki/Steam-Confirmation-Polling |
| [options.defaultConfirmationChecker.type] | <code>string</code> |  | "manual" or "auto" - manual will not have the identity secret passed into startConfirmationChecker, whereas auto will - and auto will accept any mobile confirmation. |
| [options.defaultConfirmationChecker.pollInterval] | <code>number</code> |  | the interval in ms for which it checks. 10000 is a safe amount and will avoid rate limiting. |
| [options.loginInterval] | <code>Object</code> |  | an object containing login interval settings |
| [options.loginInterval.time] | <code>number</code> |  | time in seconds for the interval to last |
| [options.loginInterval.limit] | <code>number</code> |  | the number of logins we can make in this interval before we start blocking |
| [options.assetSettings] | <code>Object</code> | <code>{}</code> | asset settings which are parsed into the constructor for steam-tradeoffer-manager. Set to false to ignore default value |
| [options.assetSettings.language] | <code>string</code> | <code>&quot;&#x27;en&#x27;&quot;</code> | which language will be used for item descriptions |
| [options.assetSettings.globalAssetCache] | <code>boolean</code> |  | see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#globalassetcache |
| [options.assetSettings.assetCacheMaxItems] | <code>number</code> |  | see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#assetcachemaxitems |
| [options.assetSettings.assetCacheGcInterval] | <code>number</code> |  | see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#assetcachegcinterval |
| [options.assetSettings.dataDirectory] | <code>string</code> |  | see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#datadirectory |

<a name="BotManager+addBot"></a>

### botManager.addBot(loginInfo, options) ⇒ <code>Promise</code>
Adds a new bot to the bot manager.

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>Promise</code> - - Promise object which will resolve once the bot has successfully logged in for the first time. Returns the Bot instance which will contain the manager, community and client (and other things related to the bot). Rejects on the first login if something goes wrong.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| loginInfo | <code>Object</code> |  | an object containing details for the logon - these are parsed into node-steam-user's logOn method, so read this documentation for more info: https://github.com/DoctorMcKay/node-steam-user#logondetails - the documentation below is what I use for steam bots |
| loginInfo.accountName | <code>string</code> |  | If logging into a user account, the account's name |
| loginInfo.password | <code>string</code> |  | If logging into an account without a login key or a web logon token, the account's password |
| [loginInfo.identity] | <code>string</code> \| <code>Buffer</code> |  | the identity_secret of the account - as a Buffer, hex string, or base64 string |
| [loginInfo.secret] | <code>string</code> \| <code>Buffer</code> |  | the shared_secret of the account - as Buffer, hex string, or base64 string |
| [loginInfo.type] | <code>string</code> |  | what type the bot will be, there can be multiple bots of the same type (e.g. storage) |
| [loginInfo.subtype] | <code>string</code> |  | what subtype the bot will be, there can be multiple bots of the same subtype. |
| [loginInfo.id] | <code>string</code> |  | a unique identifier for the bot in the case that in your code you want a way of mapping this type of bot for any accountName it gets changed to |
| [loginInfo.confirmationChecker] | <code>Object</code> |  | an object containing behaviour for the confirmation checker for this bot, just like the defaultConfirmationChecker object in the constructor |
| [loginInfo.confirmationChecker.type] | <code>string</code> |  | "manual" or "auto" - manual will not have the identity secret passed into startConfirmationChecker, whereas auto will - and auto will accept any mobile confirmation. |
| [loginInfo.confirmationChecker.pollInterval] | <code>number</code> |  | the interval in ms for which it checks. 10000 is a safe amount and will avoid rate limiting. |
| options | <code>Object</code> |  | an object containing optional settings that can be used when creating the bot |
| [options.managerEvents] | <code>Array.&lt;Object&gt;</code> |  | an array containing the node-steam-tradeoffer-manager events for the bot. https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#events - the mapping for the objects are below |
| [options.managerEvents[].name] | <code>string</code> |  | the name of the event, same as the events from node-steam-tradeoffer-manager |
| [options.managerEvents[].cb] | <code>function</code> |  | Function callback for this event. (e.g. for the newOffer event it would be cb: (offer) => {}) |
| [options.pollData] | <code>Object</code> |  | pollData for the bot that can be gracefully resumed. https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/Polling |
| [options.assetSettings] | <code>Object</code> |  | asset settings which are parsed into the constructor for steam-tradeoffer-manager, if not supplied the ones from the bot manager are used |
| [options.assetSettings.language] | <code>string</code> | <code>&quot;&#x27;en&#x27;&quot;</code> | which language will be used for item descriptions |
| [options.assetSettings.globalAssetCache] | <code>boolean</code> |  | see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#globalassetcache |
| [options.assetSettings.assetCacheMaxItems] | <code>number</code> |  | see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#assetcachemaxitems |
| [options.assetSettings.assetCacheGcInterval] | <code>number</code> |  | see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#assetcachegcinterval |
| [options.assetSettings.dataDirectory] | <code>string</code> |  | see https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager#datadirectory |

<a name="BotManager+addBots"></a>

### botManager.addBots(bots) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
A convenient (not so convenient) way of adding multiple bots

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Array.&lt;Bot&gt;</code>](#Bot) - - Array of Bot instances made by addBot  

| Param | Type | Description |
| --- | --- | --- |
| bots | <code>Array.&lt;Object&gt;</code> | Array of objects where |
| bots.loginInfo | <code>Object</code> | Is loginInfo used in addBot |
| [bots.options] | <code>Object</code> | Is options used in addBot |

<a name="BotManager+addAndLoginToBot"></a>

### botManager.addAndLoginToBot(loginInfo, [options]) ⇒ <code>Promise</code>
An easy way of adding a bot and logging into it

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>Promise</code> - - Returns a promise where the promised value a Bot instance given by login()  

| Param | Type | Description |
| --- | --- | --- |
| loginInfo | <code>Object</code> | Is loginInfo used in addBot |
| [options] | <code>Object</code> | Is options used in addBot |

<a name="BotManager+addAndLoginToBots"></a>

### botManager.addAndLoginToBots(bots) ⇒ <code>Promise</code>
A convenient (not so convenient) way of adding and logging into multiple bots

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>Promise</code> - - Returns a promise where the promised value is an array of Bot instances given by login()  

| Param | Type | Description |
| --- | --- | --- |
| bots | <code>Array.&lt;Object&gt;</code> | Array of objects where |
| bots.loginInfo | <code>Object</code> | Is loginInfo used in addBot |
| [bots.options] | <code>Object</code> | Is options used in addBot |

<a name="BotManager+retryLogin"></a>

### botManager.retryLogin(botIndex)
Triggers a login for a bot.
Alias of login

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  

| Param | Type | Description |
| --- | --- | --- |
| botIndex | <code>number</code> | the index in the bots array for the bot we wish to relogin |

<a name="BotManager+login"></a>

### botManager.login(botIndex)
Triggers a login for a bot.

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  

| Param | Type | Description |
| --- | --- | --- |
| botIndex | <code>number</code> | the index in the bots array for the bot we wish to relogin |

<a name="BotManager+loadInventories"></a>

### botManager.loadInventories(appid, contextid, tradableOnly, [retries], [language]) ⇒ <code>Promise</code>
Loads all the inventories for the bots

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: <code>Promise</code> - - Promise object containing all the inventories for the bots. The botIndex is contained in each item.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| appid | <code>int</code> |  | The Steam application ID of the app |
| contextid | <code>int</code> |  | The ID of the context within the app you wish to retrieve |
| tradableOnly | <code>boolean</code> |  | True to get tradeable items only |
| [retries] | <code>int</code> | <code>200</code> | Number of total retries until we stop loading all inventories |
| [language] | <code>string</code> | <code>&quot;&#x27;english&#x27;&quot;</code> | Language of item descriptions |

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

<a name="BotManager+getBotsByTypes"></a>

### botManager.getBotsByTypes(types) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
Gets a list of bots filtered by an array of types

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Array.&lt;Bot&gt;</code>](#Bot) - - the bot objects  

| Param | Type | Description |
| --- | --- | --- |
| types | <code>Array.&lt;String&gt;</code> | the desired types |

<a name="BotManager+getBotsBySubtype"></a>

### botManager.getBotsBySubtype(subtype) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
Gets a list of bots filtered by a subtype.

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Array.&lt;Bot&gt;</code>](#Bot) - - the bot objects  

| Param | Type | Description |
| --- | --- | --- |
| subtype | <code>String</code> | the desired subtype |

<a name="BotManager+getBotsBySubtypeOnly"></a>

### botManager.getBotsBySubtypeOnly(subtype) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
Gets a list of bots filtered by a subtype only.

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Array.&lt;Bot&gt;</code>](#Bot) - - the bot objects  

| Param | Type | Description |
| --- | --- | --- |
| subtype | <code>String</code> | the desired subtype |

<a name="BotManager+getBotByType"></a>

### botManager.getBotByType(type) ⇒ [<code>Bot</code>](#Bot)
Gets a bot by a type by rotating through the filtered bots.

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Bot</code>](#Bot) - - the bot  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | the desired type |

<a name="BotManager+getBotBySubtype"></a>

### botManager.getBotBySubtype(type, subtype) ⇒ [<code>Bot</code>](#Bot)
Gets a bot by a subtype by rotating through the filtered bots.

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  
**Returns**: [<code>Bot</code>](#Bot) - - the bot  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | the desired type |
| subtype | <code>String</code> | the desired subtype |

<a name="BotManager+acceptOffer"></a>

### botManager.acceptOffer(offer, [retries], [delay], [maxDelay], [factor])
Accept an offer with exponential backoff with a factor of 2.
Exponential backoff only applies on retries after the first attempt to accept the offer.

**Kind**: instance method of [<code>BotManager</code>](#BotManager)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| offer | <code>TradeOffer</code> |  | The offer to be accepted |
| [retries] | <code>number</code> | <code>3</code> | Number of retries (not including the initial attempt to accept the offer) |
| [delay] | <code>number</code> | <code>15000</code> | The delay applied on the first retry attempt |
| [maxDelay] | <code>number</code> | <code>60000</code> | The maximum delay on a retry attempt |
| [factor] | <code>number</code> | <code>2</code> | The exponential factor applied |

<a name="Bot"></a>

## Bot ⇐ <code>EventEmitter</code>
Our Bot, extends EventEmitter to have an in-built EventEmitter for logging under 'log'.For documentation on this constructor see addBot in the bot manager.loginInfo is generally set in the config of the bot, whereas options is done by the code adding the bot (e.g. reading from DB, getting pollData)

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [Bot](#Bot) ⇐ <code>EventEmitter</code>
    * [.login()](#Bot+login)
    * [.retryLogin()](#Bot+retryLogin)
    * [.communityLoggedIn()](#Bot+communityLoggedIn) ⇒ <code>Promise</code>
    * [.clientLoggedIn()](#Bot+clientLoggedIn) ⇒ <code>Boolean</code>
    * [.loggedIn()](#Bot+loggedIn) ⇒ <code>Promise</code>

<a name="Bot+login"></a>

### bot.login()
Triggers the login for the bot, which is handled in the events in addBot. Used when initially logging in also.

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+retryLogin"></a>

### bot.retryLogin()
Triggers the login for the bot, which is handled in the events in addBot. Used when initially logging in also.Alias of login.

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+communityLoggedIn"></a>

### bot.communityLoggedIn() ⇒ <code>Promise</code>
Gets the bots logged in state for steamcommunity (web session), async because of the node-steamcommunity call

**Kind**: instance method of [<code>Bot</code>](#Bot)  
**Returns**: <code>Promise</code> - - Resolves true if true, rejects an error if not  
<a name="Bot+clientLoggedIn"></a>

### bot.clientLoggedIn() ⇒ <code>Boolean</code>
Gets the bots logged in state for the Steam client (node-steam-user)

**Kind**: instance method of [<code>Bot</code>](#Bot)  
**Returns**: <code>Boolean</code> - - Returns true if logged in, false if not  
<a name="Bot+loggedIn"></a>

### bot.loggedIn() ⇒ <code>Promise</code>
Gets the bots logged in state, async because of the node-steamcommunity call

**Kind**: instance method of [<code>Bot</code>](#Bot)  
**Returns**: <code>Promise</code> - - Resolves if both community and client are logged in, rejects with a response as to which are logged out if one is logged out  
