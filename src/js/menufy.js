/* This is a collection of stuff to help me turn things into menus 
 * It's in a seperate file to keep the main one cleaner
 */

module.exports.er = function(opt) {
	
	this.guilds = function(guilds, order) {
		if(order !== undefined) {
			//discord doesn't give the guilds in order smh
			var sortedGuilds = [];
			order.forEach(function(guildId) {
				guilds.forEach(function(guild) {
					if (guild.id === guildId) {
						sortedGuilds.push(guild);
						return;
					}
				});
			});
			guilds = sortedGuilds;
		}

		var items = [];
		guilds.forEach(function(guild) {
			items.unshift({ //add to start of array
				id: guild.id,
				title: guild.name
			});
		});
		return items;
	};
	
	this.channels = function(channels) { //no order param since the channels have a 'position' property
		channels.sort(function(a,b) {return (a.position < b.position) ? 1 : ((b.position < a.position) ? -1 : 0);} );
		
		console.log(JSON.stringify(channels, null, 2));
		
		var items = [];
		channels.forEach(function(channel) {
			if (channel.type !== 'text') return;
			items.unshift({ //add to start of array
				id: channel.id,
				guild_id: channel.guild_id,
				title: '#' + channel.name,
				name: channel.name,
				topic: channel.topic
			});
		});
		return items;
	};
	
};