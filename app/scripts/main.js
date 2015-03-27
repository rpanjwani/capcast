var recognition = new webkitSpeechRecognition();
var dataChannel;
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = "en-US";
recognition.onresult = function(event) {
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
		 document.getElementById('captions').innerHTML += "\n<span class='user-id'>" + meeting.getSignaler().userid + "</span>: " + event.data;

	};

    dataChannel.onopen = function () {
    	//dataChannel.send('first text message over RTP data ports');
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

//for some reason, we need to fail for the first socket otherwise it doesn't work! hence using 0.0.0.0.
var websockets = ['ws://0.0.0.0','ws://54.148.27.246:12034','ws://54.69.7.201:12034','ws://52.10.3.42:12034','ws://52.11.240.209:12034'];
var currentSocket=0;

function initWs(channel, onmessage) {
	var websocket = new WebSocket(websockets[currentSocket]);
	console.log("connecting to " + websockets[currentSocket]);
	websocket.onopen = function () {
		console.log("opening " + websockets[currentSocket]);
		websocket.push(JSON.stringify({
			open: true,
			channel: channel
		}));
	};

	websocket.push = websocket.send;
	websocket.send = function (data) {
		//console.log(data);
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
