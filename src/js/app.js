/*jshint -W041 */

var version = '0.0.5';

var UI = require('ui');
var Voice = require('ui/voice');
var Vibe = require('ui/vibe');
var Discord = require('d4p.js');
var Menufy = require('menufy.js');
var token = "put your token here (settings soon I promise)";

var client = new Discord.Client({debug: true});
var menufy = new Menufy.er();

var Settings = require('settings');
var fontSize = Settings.option('fontSize'); //guess
if (fontSize === undefined) fontSize = 0;
var fontSizeName = ['small', 'large', 'mono', 'classic-small', 'classic-large'];

var currentChannel = '0';
var channelText = {};

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

// Global channelCard so that it can be edited later
/*
var channelCard = new UI.Card({
  scrollable: true
});

channelCard.on('longClick', function(e) { // Clear channel on long click
  channelText[currentChannel] = [];
  channelCard.body('');
});

channelCard.on('click', function(e) { // TODO: implement message sending so this actually does something
  Voice.dictate('start', false, function(e) {
    if (e.err) {
      console.log('Error: ' + e.err);
      return;
    }

    channelCard.subtitle('Success: ' + e.transcription);
  });
});

channelCard.on('hide', function(q){
  channelText[currentChannel] = channelText[currentChannel].slice(0, 3);
  currentChannel = 0;
});
*/
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
/*
client.on('message', function(message) {
  if (channelText[message.channel_id] == null)
    channelText[message.channel_id] = [];
  
  channelText[message.channel_id] = unshift(formatMessage(message), channelText[message.channel_id]);
    // Insert a new message to the start of the array
    // gotta love that array.unshift doesn't seem to be officially supported, maybe I just suck at JS
  
  if (channelText[message.channel_id].length > 6) // We're only cachine 6 messages currently
    channelText[message.channel_id] = channelText[message.channel_id].slice(0, 6);
  
	if (message.channel_id !== currentChannel) return; // If we're not viewing the channel, we don't need to do anything
  
  channelCard.title('#' + message.channel.name);
  channelCard.body(displayMessages(channelText[message.channel_id]));
  channelCard.style(fontSizeName[fontSize]);
  
  message.mentions.forEach(function(user) { // Vibrate if mentioned
    if (user.id == client.user[0].id)
      Vibe.vibrate('double');
  });
});
*/

client.on('message', function(message) {
	console.log('Got Message! #' + message.channel.name + ' ' + message.channel.id + '\n' + currentChannel);
	if (storedMessages[message.channel_id] == null) {
    storedMessages[message.channel_id] = [];
	}
	
	storedMessages[message.channel_id].unshift(message);
	
	if (message.channel_id !== currentChannel) {
		if (storedMessages[message.channel_id].length > 6) { // We're only cachine 6 messages currently
   	 storedMessages[message.channel_id] = storedMessages[message.channel_id].slice(0, 6);
		}
	} else {
		console.log('Message in current channel!');
		if (storedMessages[message.channel_id].length > 20) { // Cache 20 messages of the user is looking at the channel
   	 storedMessages[message.channel_id] = storedMessages[message.channel_id].slice(0, 20);
		}
		message.mentions.forEach(function(user) { // Vibrate if mentioned
    if (user.id == client.user[0].id)
      Vibe.vibrate('double');
  	});
		channelMessages.selection(function(e) {
			console.log(e.itemIndex);
		});
		
		channelMessages.items(0, menufy.messages(storedMessages[currentChannel])); //update the messages
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
		/*
    if (channelText[e.item.id] == null) // Check if we have any messages cached
      channelText[e.item.id] = []; // if no, create a new array to prevent chaos
    
    channelCard.title('#' + e.item.name);
    channelCard.body(displayMessages(channelText[e.item.id]));
    channelCard.style(fontSizeName[fontSize]);
    currentChannel = e.item.id;
    
		channelCard.show();
		*/
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

function unshift(item, array) {
  var newArray = new Array(array.length + 1);
  newArray[0] = item;
  for (var i = 1; i < newArray.length; i++) {
    newArray[i] = array[i - 1];
  }
  
  return newArray;
}

function displayMessages(array) {
  var text = '';
  
  array.forEach(function(message) {
    if (text === '')
      text = message;
    else
      text = text + '\n' + message;
  });
  
  return text;
}

function formatMessage(message) { // Takes a message object and turns mentions into readable text, and checks nicknames
  // A lot of this is assuming that we're in a server and not a private message.
  
  var content = message.cleanContent;
  if (content.length > 250) // Trim the message to 250 characters to keep from crashing, though this may not help much
    content = content.substring(0, 250) + '...'; // TODO: find the closest space so it isn't cut in the middle of a word.
  return content;
}


function showMessage(message) {
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