var recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = "en-CA";
recognition.onresult = function(event) {
	var final_transcript = ""
	for (var i = event.resultIndex; i < event.results.length; ++i) {
    	if (event.results[i].isFinal) {
        	final_transcript += event.results[i][0].transcript;
     	}
    }
    if(dataChannel)
		dataChannel.send(final_transcript);
	// if(meeting && meeting.signaler && meeting.signaler.peers) {
	// 	console.log("has peers");
	// 	var peerConnection = peers[0];
	// 	var dataChannel = peerConnection.createDataChannel("myChannel", dataChannelOptions);
	// 	dataChannel.onmessage = function (event) {
	// 	  console.log("Got Data Channel Message:", event.data);
	// 	};
	// 	console.log("sending " + final_transcript);
	// 	dataChannel.send(final_transcript);
	// }
}
recognition.start();


var meeting = new Meeting();

var meetingsList = document.getElementById('meetings-list');
var meetingRooms = {};
meeting.onmeeting = function (room) {
    if (meetingRooms[room.roomid]) return;
    meetingRooms[room.roomid] = room;

    var div = document.createElement('div');
    div.innerHTML = room.roomid;
    var button = document.createElement('button');
    button.innerHTML = 'Join';

    div.insertBefore(button, div.firstChild);
    meetingsList.insertBefore(div, meetingsList.firstChild);

    button.onclick = function() {
    	room = meetingRooms[room.roomid];
    	if(room) meeting.meet(room);
    	meetingsList.style.display = 'none';
    }
};

var dataChannel;

meeting.establishDataChannel = function (dataChannel) {
	// var dataChannelOptions = {
	// 	ordered: false, // do not guarantee order
	// 	maxRetransmitTime: 3000, // in milliseconds
	// };
	//dataChannel = peerConnection.createDataChannel("myChannel", dataChannelOptions);
	dataChannel.onmessage = function (event) {
		console.log("Got Data Channel Message:", event.data);
	};

    dataChannel.onopen = function () {
    	dataChannel.send('first text message over RTP data ports');
    };

    dataChannel.onclose = function (e) {
        console.error(e);
    };

    dataChannel.onerror = function (e) {
        console.error(e);
    };
}

var remoteMediaStreams = document.getElementById('remote-streams-container');
var localMediaStream = document.getElementById('local-streams-container');

// on getting media stream
meeting.onaddstream = function (e) {
	var captions = document.getElementById('captions');
    if (e.type == 'local') localMediaStream.appendChild(e.video);
    if (e.type == 'remote') remoteMediaStreams.insertBefore(e.video, remoteMediaStreams.firstChild);
};

function initWs(websocket, channel, onmessage) {
	websocket.onopen = function () {
		
		websocket.push(JSON.stringify({
			open: true,
			channel: channel
		}));
	};
	websocket.push = websocket.send;
	websocket.send = function (data) {
		console.log(data);
		if(websocket.readyState != 1) {
			return setTimeout(function() {
				websocket.send(data);
			}, 300);
		}
		
		websocket.push(JSON.stringify({
			data: data,
			channel: channel
		}));
	};
	websocket.onmessage = function(e) {
		onmessage(JSON.parse(e.data));
	};
}

meeting.openSignalingChannel = function(onmessage) {
	var channel = location.href.replace(/\/|:|#|%|\.|\[|\]/g, '');
	//var websocket = new WebSocket('wss://wsnodejs.nodejitsu.com:443');
	var websocket = new WebSocket('ws://52.10.201.60:12034');
	initWs(websocket,channel,onmessage);

	websocket.onerror = function(event) {
		alert('riz');
		websocket = new WebSocket('ws://52.10.112.31:12034');
		initWs(websocket,channel,onmessage);
	}

	// 	websocket.onerror = function(event) {
	// 		alert('riz failed');
	// 		websocket = new WebSocket('ws://52.10.60.41:12034');
	// 		initWs(websocket,channel,onmessage);
	// 	}
	// };

	return websocket;
};

// using firebase for signaling
// meeting.firebase = 'muazkh';

// if someone leaves; just remove his video
meeting.onuserleft = function (userid) {
    var video = document.getElementById(userid);
    if (video) video.parentNode.removeChild(video);
};

// check pre-created meeting rooms
meeting.check();

document.getElementById('setup-meeting').onclick = function () {
    
    var meetingRoomName = document.getElementById('meeting-name').value || 'Simple Meeting';
    // setup new meeting room
    meeting.setup(meetingRoomName);
    
    this.disabled = true;
    this.parentNode.innerHTML = '<h2><a href="' + location.href + '" target="_blank">Share this link</a></h2>';
};
