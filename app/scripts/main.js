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

var remoteMediaStreams = document.getElementById('remote-streams-container');
var localMediaStream = document.getElementById('local-streams-container');

// on getting media stream
meeting.onaddstream = function (e) {
	var captions = document.getElementById('captions');
	// var recognition = new webkitSpeechRecognition();
	// recognition.continuous = true;
	// recognition.interimResults = true;
	// recognition.lang = "en-CA";
	// recognition.onresult = function(event) { 

	// 	captions.innerHTML = event.results[0][0].transcript;
	// }
	// recognition.start();
    if (e.type == 'local') localMediaStream.appendChild(e.video);
    if (e.type == 'remote') remoteMediaStreams.insertBefore(e.video, remoteMediaStreams.firstChild);
};

meeting.openSignalingChannel = function(onmessage) {
	var channel = location.href.replace(/\/|:|#|%|\.|\[|\]/g, '');
	//var websocket = new WebSocket('wss://wsnodejs.nodejitsu.com:443');
	var websocket = new WebSocket('ws://52.10.187.205:12034');
	websocket.onopen = function () {
		
		websocket.push(JSON.stringify({
			open: true,
			channel: channel
		}));
	};

	websocket.onerror = function(event) {
		
		websocket = new WebSocket('ws://52.10.85.220:12034');
		websocket.onopen = function () {
			websocket.push(JSON.stringify({
				open: true,
				channel: channel
			}));
		};

		websocket.onerror = function(event) {
			
			websocket = new WebSocket('ws://52.10.60.41:12034');
			websocket.onopen = function () {
				websocket.push(JSON.stringify({
					open: true,
					channel: channel
				}));
			};
			websocket.push = websocket.send;
			websocket.send = function (data) {

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


		websocket.push = websocket.send;
		websocket.send = function (data) {

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
	};

	websocket.push = websocket.send;
	websocket.send = function (data) {

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
