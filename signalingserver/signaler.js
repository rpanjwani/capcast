// https://www.webrtc-experiment.com/

// Dependencies:
// 1. WebSocket
// 2. Node-Static

// Features:
// 1. WebSocket over Nodejs connection
// 2. WebSocket channels i.e. rooms

var fs = require('fs');
var rp = require('request-promise');
var _static = require('node-static');
var file = new _static.Server('./public');

// HTTP server
var app = require('http').createServer(function(request, response) {
    request.addListener('end', function() {
        file.serve(request, response);
    }).resume();
});

var WebSocketServer = require('websocket').server;

new WebSocketServer({
    httpServer: app,
    autoAcceptConnections: false
}).on('request', onRequest);

// shared stuff

var CHANNELS = { };

var publicIp;

function onRequest(socket) {
    var origin = socket.origin + socket.resource;

    var websocket = socket.accept(null, origin);
    websocket.on('message', function(message) {
        if (message.type === 'utf8') {
  	    message.publicIp = publicIp;
            onMessage(JSON.parse(message.utf8Data), websocket);
        }
    });

    websocket.on('close', function() {
        truncateChannels(websocket);
    });
}

function onMessage(message, websocket) {
    if (message.checkPresence)
        checkPresence(message, websocket);
    else if (message.open)
        onOpen(message, websocket);
    else
        sendMessage(message, websocket, false);
}

function onOpen(message, websocket) {
    var channel = CHANNELS[message.channel];

    if (channel)
        CHANNELS[message.channel][channel.length] = websocket;
    else
        CHANNELS[message.channel] = [websocket];
    message.data = {};
    message.data.publicIp = publicIp;
    sendMessage(message, websocket, true);
}

function sendMessage(message, websocket, selfMessage) {
    console.log(JSON.stringify(selfMessage));
    message.data = JSON.stringify(message.data);
    if(selfMessage) {
	message.data = JSON.stringify(message.data);
    }

    var channel = CHANNELS[message.channel];
    if (!channel) {
        console.error('no such channel exists');
        return;
    }

    for (var i = 0; i < channel.length; i++) {
        if (channel[i] && (selfMessage || channel[i] != websocket)) {
            try {
                channel[i].sendUTF(message.data);
            } catch(e) {
            }
        }
    }
}

function checkPresence(message, websocket) {
    websocket.sendUTF(JSON.stringify({
        isChannelPresent: !!CHANNELS[message.channel]
    }));
}

function swapArray(arr) {
    var swapped = [],
        length = arr.length;
    for (var i = 0; i < length; i++) {
        if (arr[i])
            swapped[swapped.length] = arr[i];
    }
    return swapped;
}

function truncateChannels(websocket) {
    for (var channel in CHANNELS) {
        var _channel = CHANNELS[channel];
        for (var i = 0; i < _channel.length; i++) {
            if (_channel[i] == websocket)
                delete _channel[i];
        }
        CHANNELS[channel] = swapArray(_channel);
        if (CHANNELS && CHANNELS[channel] && !CHANNELS[channel].length)
            delete CHANNELS[channel];
    }
}

rp('http://169.254.169.254/latest/meta-data/public-ipv4').then(function(response){
    var port = process.argv[2];
    if(!port) port = 12034;
	publicIp = response; 
	app.listen(port);
	console.log('listening on http://' + publicIp + ':' + port);
}).catch(console.error);
