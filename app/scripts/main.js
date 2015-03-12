var recognition = new webkitSpeechRecognition();
var dataChannel;
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = "en-US";
recognition.onresult = function(event) {
	alert("recognize");
	var final_transcript = ""
	for (var i = event.resultIndex; i < event.results.length; ++i) {
    	if (event.results[i].isFinal) {
        	final_transcript += event.results[i][0].transcript;
     	}
    }

    console.log("recognized " + final_transcript);
   
    if(dataChannel){
    	console.log("sending data channel message" + final_transcript);
		dataChannel.send(final_transcript);
    }
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
    var span = document.createElement('span');
    span.innerHTML = room.roomid;
    span.className="room-name";
    var button = document.createElement('button');
    button.className = "btn-secondary btn btn-md";
    button.innerHTML = 'Join';

    div.appendChild(span);
    div.appendChild(button);
    meetingsList.insertBefore(div, meetingsList.firstChild);

    button.onclick = function() {
    	room = meetingRooms[room.roomid];
    	if(room) meeting.meet(room);
    	meetingsList.style.display = 'none';
    	videos.style.visibility = 'visible';
    }
};

meeting.establishDataChannel = function (dataChan) {
	// var dataChannelOptions = {
	// 	ordered: false, // do not guarantee order
	// 	maxRetransmitTime: 3000, // in milliseconds
	// };
	//dataChannel = peerConnection.createDataChannel("myChannel", dataChannelOptions);
	dataChannel = dataChan;
	dataChannel.onmessage = function (event) {
		console.log("Got Data Channel Message:", event.data);
		 document.getElementById('captions').value += event.data;

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
    if (e.type == 'local') localMediaStream.appendChild(e.video);
    if (e.type == 'remote') remoteMediaStreams.insertBefore(e.video, remoteMediaStreams.firstChild);
};


var websockets = ['ws://127.0.0.1:12034','ws://127.0.0.1:12035','ws://127.0.0.1:12036'];
var currentSocket=0;

function initWs(channel, onmessage) {
	var websocket = new WebSocket(websockets[currentSocket]);
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

	websocket.onclose = function(e) {
		var nextSocket = (currentSocket + 1) % websockets.length;
		console.log(websockets[currentSocket] + "closed. Connecting to " + websockets[nextSocket]);
		currentSocket = nextSocket;
		initWs(channel, onmessage);
	};

	websocket.onerror = function(e) {
		console.log("error on socket " + websockets[currentSocket] + ". Closing the socket.");
		websocket.close();
	};

	if(meeting.getSignaler())
		meeting.getSignaler().setSocket(websocket);
}

meeting.openSignalingChannel = function(onmessage) {
	var channel = location.href.replace(/\/|:|#|%|\.|\[|\]/g, '');
	initWs(channel, onmessage);
	//var websocket = new WebSocket('wss://wsnodejs.nodejitsu.com:443');
	// websocket = new WebSocket('ws://127.0.0.1:12034');
	// initWs(websocket,channel,onmessage);

	// websocket.onerror = function(event) {
	// 	console.log("closing websocket 1");
	// 	websocket.close();
	// 	alert('trying second server');
	// 	websocket = new WebSocket('ws://127.0.0.1:12035');
	// 	initWs(this,channel,onmessage);

	// 	websocket.onerror = function(event) {
	// 		console.log("closing websocket 2");
	// 		websocket.close();
	// 		alert('trying third server');
	// 		websocket = new WebSocket('ws://127.0.0.1:12036');
	// 		initWs(websocket,channel,onmessage);

	// 			websocket.onerror = function(event) {
	// 			console.log("closing websocket 3");
	// 			websocket.close();
	// 			alert('cycling through...');
	// 			meeting.openSignalingChannel(onmessage, websocket);
	// 		};
	// 	};
	// };
	// return websocket;
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
    this.parentNode.innerHTML = '<h3><a href="' + location.href + '" target="_blank">Share this link</a></h3>';
    document.getElementById('videos').style.visibility = "visible";
};
