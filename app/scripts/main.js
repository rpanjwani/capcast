var recognition = new webkitSpeechRecognition();
var dataChannel;
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = "en-US";
recognition.onresult = function(event) {
	recognitionHappened=true;
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
//recognition.start();

var recognitionHappened=false;
//makes sure recognition keeps working by restarting it if it hasn't worked in a while...
function nudgeRecognition() {
	setTimeout(function(){
		if(!recognitionHappened){
			console.log('nudging...');
			try{
				recognition.start();
			} catch(err){
				console.log(err);
			}
		}
		recognitionHappened = false;
		nudgeRecognition();
	}, 10000);
}


function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var qsRoomId = getParameterByName('roomId');
var qsServerIp = getParameterByName('serverIp');

console.log('qsServerIp: ' + qsServerIp + ' qsRoomId: ' + qsRoomId);

var meeting = new Meeting();

// var meetingsList = document.getElementById('meetings-list');
var meetingRooms = {};

meeting.onmeeting = function (room) {
	if (meetingRooms[room.roomid]) return;

    meetingRooms[room.roomid] = room;

	if(qsRoomId === room.roomid){
		meeting.meet(room);
		videos.style.visibility = 'visible';
	}

    /*if (meetingRooms[room.roomid]) return;
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
    }*/
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
		 document.getElementById('captions').innerHTML += "\n<span class='user-id'>" + meeting.getSignaler().userid + "</span>: " + event.data + "<br/>";

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
    recognition.start();
    nudgeRecognition();
};

function generateRoom() {
	var r4 = function() {
        return Math.floor(Math.random() * 0x10000).toString(16);
    };
    return r4() + "-" + r4();
}

function generateRoomLink() {
    document.getElementById('room-link').innerHTML = location.href + '?serverIp=' + 
    	currentOpenIp + '&roomId=' + currentOpenChannel ;
    document.getElementById('room-div').style.visibility = "visible";
}


//var dummyIp = "0.0.0.0";
var loadBalancerIp = "capcast-939676402.us-west-2.elb.amazonaws.com";
var port = ":12034";
var currentIp = loadBalancerIp;
var nextIp = currentIp;
var currentOpenIp;
var currentOpenChannel;

function initWs(channel, onmessage) {
	var websocket = new WebSocket("ws://" + nextIp + port);
	console.log("connecting to " + nextIp);
	currentIp = nextIp;
	websocket.onopen = function () {
		currentOpenIp = currentIp;
		currentOpenChannel = channel;
		console.log("opening " + nextIp);
		websocket.push(JSON.stringify({
			open: true,
			channel: channel
		}));
		if(!qsRoomId && currentOpenIp != loadBalancerIp){
			meeting.setup(currentOpenChannel);
			generateRoomLink();
			document.getElementById('videos').style.visibility = "visible";
		}

		if(meeting.getSignaler()){
			console.log('checking websocket: ' + websocket);
			meeting.getSignaler().setSocket(websocket);
		}
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
		/*if(currentIp === dummyIp) {
			nextIp = loadBalancerIp;
			WebSocket.close();
		}else */

		if(currentIp === loadBalancerIp){
			nextIp = JSON.parse(JSON.parse(e.data)).publicIp;
			if(nextIp) {
				console.log("closing connection to load balancer and connecting directly to server " + nextIp);
				websocket.close();
			}
		}
		onmessage(JSON.parse(e.data));
	};

	websocket.onclose = function(e) {
		setTimeout(function(){
			if(currentIp != loadBalancerIp)
				nextIp = loadBalancerIp;
			console.log(currentIp + " closed.");
			initWs(channel, onmessage);
		}, 3000);
		
	};

	websocket.onerror = function(e) {
		console.log("error on socket " + currentIp + ". Closing the socket.");		
	};
}

meeting.openSignalingChannel = function(onmessage) {
	//var channel = location.href.replace(/\/|:|#|%|\.|\[|\]/g, '');
    if(qsServerIp && qsRoomId) {
    	nextIp = qsServerIp;
    	initWs(qsRoomId, onmessage);
    } else {
		var channel = generateRoom();
		initWs(channel, onmessage);
	}
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
/*
document.getElementById('setup-meeting').onclick = function () {
    
    var meetingRoomName = document.getElementById('meeting-name').value || 'Simple Meeting';
    // setup new meeting room
    meeting.setup(meetingRoomName);
    
    this.disabled = true;
    //this.parentNode.innerHTML = '<h3><a href="' + location.href + '" target="_blank">Share this link</a></h3>';

    document.getElementById('videos').style.visibility = "visible";
};
*/