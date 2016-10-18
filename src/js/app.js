var version = '0.0.5';

var UI = require('ui');
var Discord = require('d4p.js');
var Menufy = require('menufy.js');
var token = '';

var client = new Discord.Client({debug: true});
var menufy = new Menufy.er();

var Settings = require('settings');
var fontSize = Settings.option('fontSize'); //guess
if (fontSize === undefined) fontSize = 0;
var fontSizeName = ['small', 'large', 'mono', 'classic-small', 'classic-large'];

var loadingCard = new UI.Card({
  title: 'd4p',
	body: 'Loading...',
	scrollable: true
});
loadingCard.show();

client.on('ready', function(data) {
	console.log('Ready!');
	loadingCard.hide();
	menuMain();
});

/*
client.on('message', function(message) {
	if (message.channel_id !== '147039491838705664') return;
	card.title((message.member !== undefined && message.member.nick !== null) ? message.member.nick : message.author.username);
	card.body ('#' + message.channel.name + '\n' + message.cleanContent);
});
*/

function menuMain() {
	var menu = new UI.Menu({
		sections: [{
			title: 'Your Friends',
			items: [{
				id: 'friends',
				title: 'DMs',
				subtitle: 'Select to view'
			}]
		},{
			title: 'Your Servers',
			items: [{
				id: 'servers',
				title: client.guilds.length + ' servers',
				subtitle: 'Select to view'
			}]
		}, {
			title: 'You!',
			items: [{
				id: 'user',
				title: client.user[0].username + '#' + client.user[0].discriminator,
				subtitle: 'Select for Settings'
			}]
		}]
	});

	menu.on('select', function(e) {
		switch(e.item.id) {
			case 'friends':
				//menuFriends();
			break;
				
			case 'servers':
				menuServers();
			break;
				
			case 'user':	
				menuSettings();
			break;
		}
	});
	
	menu.show();
}

function menuServers() {
	var menu = new UI.Menu({
		sections: [{
			title: 'Your Servers',
			items: menufy.guilds(client.guilds, client.guildOrder)
			}]
	});

	menu.on('select', function(e) {
		menuChannels(e.item.id);
	});
	
	menu.show();
}

function menuChannels(guildId) {
	var curGuild = client.find(client.guilds, 'id', guildId); //magic that actually works hoyl shit
	var menu = new UI.Menu({
		sections: [{
			title: curGuild.name,
			items: menufy.channels(curGuild.channels)
		}]
	});
	
	//console.log(check(curGuild.members));
	
	menu.on('select', function(e) {
		//menuChannels(e.item.id);
	});

	menu.on('longSelect', function(e) {
		var channelCard = new UI.Card({
			title: '#' + e.item.name,
			body: e.item.topic,
			scrollable: true,
			style: fontSizeName[fontSize]
		});
		channelCard.show();
	});
	
	menu.show();
}

function menuSettings() {
		console.log('Settings Loading');

		var menu = new UI.Menu({
			sections: [{
				title: 'Display',
				items :[{
					id: 1,
					title: 'Font Size',
					subtitle: capitalize(fontSizeName[fontSize]),
				}]
			}, {
				title: 'D4P v' + version
			}, {
				title: 'by Atlas#2564'
			}]
		});

		menu.on('select', function(e) {
			if (e.item.id === 1) {
				fontSize++;
				if (fontSize > fontSizeName.length - 1) fontSize = 0;
				Settings.option('fontSize', fontSize);
				menu.item(e.sectionIndex, e.itemIndex, {
					subtitle: capitalize(fontSizeName[fontSize])
				});
			}
		});

		//Show menu
		menu.show();
		console.log('Settings Loaded');
	}

client.login(token);

// Helper Functions
function capitalize(str) { //I'm lazy!
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function convertTimestamp(timestamp) {
	if (typeof timestamp === 'string') timestamp = parseInt(timestamp, 10);
	var d = new Date(timestamp);
	return padStart(d.getDate()    , 2, '0') + '/' +
		     padStart(d.getMonth()+1 , 2, '0') + '/' +
		     padStart(d.getFullYear(), 2, '0') + ' ' +
		     padStart(d.getHours()   , 2, '0') + ':' +
		     padStart(d.getMinutes() , 2, '0');
}

function padStart(str, length, fill) {
	if (typeof str === 'number') str += ''; //this works
	if (fill === undefined || fill === '') fill = ' ';
	
	while (str.length < length) {
		str = fill + str;
	}
	
	return str;
}

function check(o) { //I'm lazy
	return JSON.stringify(o, null, 2);
}
