// Something I think will be useful for my projects
// Taken from EconItem but modified into a function

// Example usage: let newinventory = res.items.filter((item) => getTag(item, 'item_class').internal_name === 'item_class_3' || getTag(item, 'item_class').internal_name === 'item_class_4');
// This filters an inventory to the item classes below

/*
	item_class_4 - emote
	item_class_3 - background
*/

module.exports = function (item, category) {
	if (!item.tags) {
		return null;
	}

	for (let i = 0; i < item.tags.length; i++) {
		if (item.tags[i].category == category) {
			return item.tags[i];
		}
	}

	return null;
};