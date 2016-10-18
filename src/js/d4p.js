module.exports.Client = function(opt) {
	/* Option is an object
   * Current Options:
   *
   * debug: bool => Show degub logs
	 *
	 */	
	
	if (opt       === undefined) opt       = {};
	if (opt.debug === undefined) opt.debug = false;
	var options = opt;
	if (opt.debug) console.log('DEBUG MODE ENABLED!');
	
	//Declare vars
	var ajax = require('ajax');
	var events = this.events = {};
	var guildOrder = this.guildOrder = [];
	var availableEvents = this.availableEvents = ['message', 'ready', 'channel_create', 'channel_update', 'channel_deleted', 'guild_create']; //events can be listened for
	var guilds  = this.guilds  = [];
	var user    = this.user    = [];
	var users   = this.users   = [];
	var friends = this.friends = [];
	
	var socket = new WebSocket("wss://gateway.discord.gg/?v=5&encoding=json");
	var api = 'https://discordapp.com/api';
	
	//FIND THINGS
	//because I'm too lazy to add collections like discord.js
  //and I'm probably the only one who will bother to use this lib
	/*Client.find(obj, key, value)
	 *
	 *obj   => Array   , Things to look in
	 *key   => String  , Property to look at (id or whatever)
	 *value => Whatever, Value to look for
	 *index => bool    , (Optional) Should it return the index instead of the object?
   *
	 *returns the thing it finds, returns undefined otherwise
	 */
	
	var find = this.find = function(obj, key, value, index) {
		index = (index === undefined ? false : index);
    var found;
		obj.forEach(function(thing, ind) {
			if (thing[key] === value) {
				console.log('ind: ' + ind);
        if(!index) {
					found = thing;
				} else {
					found = ind;
				}
			}
		});
		console.log('found: ' + found);
		return found;
	};
	
	//Actual stuff
	
		//LOGIN
	/* Client.login(userToken)
	 *
	 * userToken => String, the user's token
	 *
	 * Login to Discord and open a websocket.
	 * Gets all the user's guilds.
	 * Listens for events and calls the user's functions declared in Client.on()
	 */
	
	//Most of this was written by Gus, so big thanks to them.
	//If they didn't write the socket stuff I'd probably be lazy and never make this
	
	this.login = function(userToken) {
		var token = userToken;
		
		socket.onopen = function(event) {
			if (options.debug) console.log('SOCKET OPEN');
		};

		var lastSequence = 0;

		socket.onmessage = function(event) {
			var e = JSON.parse(event.data);
			lastSequence = e.s;
			if (e.op == 10) {
				setInterval(function(){heartbeat();}, e.d.heartbeat_interval);
				var payload = {
					"op": 2,
					"d": {
						"token": token,
						"properties": {
							"$os": "linux",
							"$browser": "Pebble4Discord"
						},
						"large_threshold": 50
					}
				};
				socket.send(JSON.stringify(payload));
			} else if (e.op == 11) {
				if (options.debug) console.log("♥️ GOT HEARTBEAT");

			} else if (e.op === 0 && e.t === 'READY') {
				if (options.debug) console.log("GOT A READY EVENT!!");

				e.d.guilds.forEach(function(guild) {
					guilds.push(guild);
				});
				
				this.guilds = guilds;
				
				e.d.user_settings.guild_positions.forEach(function(guildId){
					guildOrder.unshift(guildId);
				});
				
				this.guildOrder = guildOrder;
				
				//TODO: fix this horrible hack
				//It won't work with objects I hate everything
				user.push(e.d.user);
				this.user = user[0];
				user = user[0];
				
				e.d.relationships.forEach(function(friend) {
					friends.push(friend);
				});
				this.friends = friends;

				if (events.ready !== undefined) {
					events.ready.forEach(function(func) {
						func(e.d);
					});
				}

			} else if (e.op === 0 && e.t === 'GUILD_CREATE') {
				if (options.debug) console.log("GOT GUILD");
				this.guilds = guilds.push(e.d);
				e.d.members.forEach(function(member) {
					this.users.push(member.user);
				});
				
				if (events.guild_create !== undefined) {
					events.guild_create.forEach(function(func) {
						func(e.d);
					});
				}

			} else if (e.op === 0 && e.t === 'MESSAGE_CREATE') {
				var messageChannel, messageGuild, cleanContent = e.d.content, guildMember;
				
				//Before we give the message object, we'll add a few things to it
				
				//Here we add the guild and the channel to it
				//So you can get the channel with `message.channel`
				//And add the member object for nicks and whatever
				this.guilds.forEach(function(guild) {
					guild.channels.forEach(function(channel) {
						if (channel.id === e.d.channel_id) {
							messageChannel = channel;
							messageGuild = guild;
							guild.members.forEach(function (member) {
								if (member.user.id === e.d.author.id) guildMember = member;
							});
							return;
						}
					});
				});

				//Add `message.cleanContent`, the content with <@id> replaced with the username
				e.d.mentions.forEach(function(user) {
					cleanContent = cleanContent.replace('<@'  + user.id + '>', '@' + user.username);
					cleanContent = cleanContent.replace('<@!' + user.id + '>', '@' + user.username);
				});
				
				e.d.channel      = messageChannel;
				e.d.guild        = messageGuild;
				e.d.cleanContent = cleanContent;
				e.d.member       = guildMember;

				if (events.message !== undefined) {
					events.message.forEach(function(func) {
						func(e.d);
					});
				}
			} else if (e.op === 0 && e.t === 'CHANNEL_CREATE') {
				if (options.debug) console.log('CHANNEL_CREATE');
				if (e.d.is_private === false) { //For guild channels
					var guildIndex = find(guilds, 'id', e.d.guild_id, true);
					guilds[guildIndex].channels.push(e.d);
					this.guilds = guilds;
				} else {
					//no DM support yet
				}
				
				if (events.channel_create !== undefined) {
					events.channel_create.forEach(function(func) {
						func(e.d);
					});
				}
				
			} else if (e.op === 0 && e.t === 'CHANNEL_UPDATE') { //guild only
				if (options.debug) console.log('CHANNEL_UPDATE');
				var guildIndex   = find(guilds, 'id', e.d.guild_id, true); console.log('170 ' + guildIndex);
				var channelIndex = find(guilds[guildIndex].channels, 'id', e.d.id); console.log('171 ' + channelIndex);
				guilds[guildIndex].channels[channelIndex] = e.d; console.log('172');
				this.guilds = guilds; console.log('173');
				
				if (events.channel_update !== undefined) {
					events.channel_update.forEach(function(func) {
						func(e.d);
					});
				}
				
			} else if (e.op === 0 && e.t === 'CHANNEL_DELETE') {
				if (options.debug) console.log('CHANNEL_DELETE');
				if (e.d.is_private === false) { //For guild channels
					var guildIndex   = find(guilds, 'id', e.d.guild_id, true);
					var channelIndex = find(guilds[guildIndex].channels, 'id', e.d.id);
					guilds[guildIndex].channels.splice(channelIndex, 1);
					this.guilds = guilds;
				} else {
					//no DM support yet
				}
				
				if (events.channel_delete !== undefined) {
					events.channel_delete.forEach(function(func) {
						func(e.d);
					});
				}
				
			}
		};

		function heartbeat() {
			if (options.debug) console.log('♥️ SENDING HEARTBEAT');
			socket.send(JSON.stringify({"op": 1,"d": lastSequence}));
		}

		socket.onerror = function(err) {
			console.log("ERROR:", err);
		};
	};
	
		//CREATE EVENTS
	/* Client.on(type, func)
	 *
	 * type => String  , The name of the event to listen to
	 * func => Function, The function to call when the event fires
	 *
	 * returns nothing, throws fits if you give it the wrong things 
	 */
	
	this.on = function(type, func) {
		if (typeof func !== 'function') {
			throw new Error('You need a function you knob');
		}

		if (availableEvents.indexOf(type) !== -1) {
			if (events[type] !== undefined) {
				events[type].push(func);
			} else {
				events[type] = [func];
			}
		} else {
			throw new Error(type + ' is not a valid event!');
		}
	};
	
		//DISCORD API CALLS
	/* Client.httpApi(method, url, callback, jsonData)
	 *
	 * method   => String  , 'GET' or 'POST'
	 * url      => String  , Url to use
	 * callback => Function, Function to call once a response it received
	 * jsonData => Object  , JSON data to send to Discord
	 */
	
	var httpApi = this.httpApi = function(method, url, callback, jsonData) {
		if (jsonData === undefined) jsonData = '';
		ajax({
			url: api + url,
			method: method,
			type: 'json',
			data: jsonData,
			headers: {'User-Agent': 'Pebble-Discord (https://github.com/AtlasTheBot/Pebble-Discord, 0.0001)',
								'Authorization': 'Bearer ' + this.token}
		}, function(data) {
			if (typeof callback === 'function') callback(data);
		});
	};
};