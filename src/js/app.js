/*jshint -W041 */

var version = '0.6, road is gya';

var UI = require('ui');
var Voice = require('ui/voice');
var Vibe = require('ui/vibe');
var Discord = require('d4p.js');
var Menufy = require('menufy.js');
var token = "token here m8";

var client = new Discord.Client({debug: true});
var menufy = new Menufy.er();

var Settings = require('settings');
var fontSize = Settings.option('fontSize'); //guess
if (fontSize === undefined) fontSize = 0;
var fontSizeName = ['small', 'large', 'mono', 'classic-small', 'classic-large'];

var currentChannel = '0';
var storedMessages = {};
//Stored as:
//'channelId': [
//	{
//		author: ...
//		content: ...
//    otherMessageStuff
//	}
//]

//Global Menu for messages
var channelMessages = new UI.Menu({});

channelMessages.on('select', function(e) {
	showMessage(e.item.message);
});

channelMessages.on('longSelect', function(e) {
	Voice.dictate('start', false, function(e) {
    if (e.err) {
      console.log('Error: ' + e.err);
      return;
    }

    console.log('Success: ' + e.transcription);
  });
});

//I'd get it to reduce the stored messages to 6 when you leave the channel
//But I can't seem to register the back button click event
//And using on 'hide' breaks it when you look at a message
//Also it's 3 am as I'm writing this

var loadingCard = new UI.Card({
  title: 'd4p',
	body: 'Loading...',
	scrollable: false
});
loadingCard.show();

client.on('ready', function(data) {
	console.log('Ready!');
	loadingCard.hide();
	menuMain();
});

client.on('message', function(message) {
	//console.log('Got Message! #' + message.channel.name + ' ' + message.channel.id + '\n' + currentChannel);
	if (storedMessages[message.channel_id] == null) {
    storedMessages[message.channel_id] = [];
	}
	
	storedMessages[message.channel_id].push(message);
	
	if (message.channel_id !== currentChannel) {
		if (storedMessages[message.channel_id].length > 6) { // We're only caching 6 messages currently
   	 storedMessages[message.channel_id].shift();
		}
	} else {
		console.log('Message in current channel!');
		var MAX_MESSAGES_CUR = 20; //Max amount of messages to cache
		if (storedMessages[message.channel_id].length > MAX_MESSAGES_CUR) { // Cache messages of the channel that the user is viewing
   	 storedMessages[message.channel_id].shift(0, MAX_MESSAGES_CUR);
		}
		message.mentions.forEach(function(user) { // Vibrate if mentioned
    if (user.id == client.user[0].id)
      Vibe.vibrate('double');
  	});
		
		channelMessages.items(0, menufy.messages(storedMessages[currentChannel])); //update the messages
		channelMessages.selection(function(e) {
			if(e.itemIndex === storedMessages[currentChannel].length - 1) { //If the user has the last message selected, auto-scroll to latest one
				 channelMessages.selection(0, storedMessages[currentChannel].length - 1);
			} else if (e.itemIndex !== 0 && storedMessages[currentChannel].length !== MAX_MESSAGES_CUR){ //Auto-Scroll so that the highlighted message is always in view
				channelMessages.selection(0, e.itemIndex - 1);
			}
		});
	}
	
});

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
	
	menu.on('longSelect', function(e) {
		var channelDetails = new UI.Card({
			title: '#' + e.item.name,
			body: e.item.topic,
			scrollable: true,
			style: fontSizeName[fontSize]
		});
    
    channelDetails.show();
	});

	menu.on('select', function(e) {
		menuMessages(e.item.id, e.item.name);
	});
	
	menu.show();
}

function menuMessages(channelId, channelName) {
	currentChannel = channelId;
	channelMessages.section(0, {
		title: '#' + channelName,
		items: menufy.messages(storedMessages[channelId])
	});
	channelMessages.show();
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
			}, {
				title: '& Googie2149#1368'
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

function formatMessage(message) { // Takes a message object and turns mentions into readable text, and checks nicknames
  // A lot of this is assuming that we're in a server and not a private message.
  
  var content = message.cleanContent;
  if (content.length > 250) // Trim the message to 250 characters to keep from crashing, though this may not help much
    content = content.substring(0, 250) + '...'; // TODO: find the closest space so it isn't cut in the middle of a word.
  return content;
}

function showMessage(message) {
	console.log('timestamp' + message.timestamp);
	//2016-10-24T07:10:43.761000+00:00
		var card = new UI.Card({
			title:  message.author.username,
			subtitle: (message.timestamp !== '-1' ? convertTimestamp(message.timestamp) : ''),
			body: formatMessage(message),
			scrollable: true,
			style: fontSizeName[fontSize]
	});
	card.show();
}

function convertTimestamp(timestamp) {
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