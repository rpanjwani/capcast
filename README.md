# capCast
A video conferencing app that produces speech to text captions in real time. This project will comprise of combined project work for Csc 462/562, Csc 466/566, and Csc 461/561.

## Tools and Instructions
Our [wiki](https://github.com/rpanjwani/capcast/wiki/Tools-Instructions) contains instructions on how to get the front-end running on your machine, our coding structure, test cases, etc.

## Log
Our [wiki](https://github.com/rpanjwani/capcast/wiki/Logbook) also contains our struggles and endeavours while we build this awesome project.

## Our Website:
<http://rpanjwani.github.io/capcast>

## Why?
CapCast will allow video conferencing using a web-browser while producing captions in real time. This can aid in better communication between users in the following ways:
- When there are connection problems at the client end, the video and audio quality may degrade making communication difficult. Having captions can allow the conversation to go on.
- Help people with hearing disabilities.
- Make communication better by simply using more channels (video/audio + caption text).
- Save the transcript so the clients can review it later without having to save the audio/video.
- Users don't have to sign up for accounts. They just have to generate a one-time shareable link for a conversation and distribute it to the parties with whom communication is desired. 

## What else is out there?
There are other video conferencing services out there like skype, google hangouts, etc. However, we haven't been able to find anything that provides captioning in real time. Also these other services make people sign up for accounts, whereas with our service, users just have to generate a one-time shareable link for a conversation and distribute it to the parties with whom communication is desired. 
 
## Contributors
- Riz Panjwani
- Harsh Dawar
- Sumit Kadyan
- Khushboo Gandhi
 
## Key Features
CapCast will allow a user to do the following:
- generate a link for the video conference that users can share to join the conference.
- call one or more users.
- turn captioning on/off.
- save the caption transcript.

## Major Components

We have broken down the project into the following components that correspond to the appropriate course work below.

### Peer to Peer Clients (csc 466 / 566 - P2P Overlay Component)
A client is simply a browser running on a user's computer. If the call is one-to-one (only two clients connected to each other), then capCast will use a P2P connection using WebRTC in order to stream the video conference. Otherwise, it will switch to using a capCast host server to carry out the communication.

### CapCast Host Servers (csc 462 / 562 - Distributed Systems Component)
CapCast host servers will be a distributed system that host the application. The system will facilitate a call between users. If there are two clients, the system will offload the streaming to the p2p model, where the clients will handle the streaming amongst themselves. When a call involves more than two clients, the server will facilitate the video streaming. We will simulate delays, network loss, and node fault to demonstrate the system's ability to cope with failure.

### Video Streaming and Captioning (csc 461 / 561 - Multimedia Systems Component)
Video conferencing will be done using HTML5 and WebRTC. Real-time speech to text captioning will be done using the Google Web Speech API.

## Milestones (2015)
- Feb 16: Have Signal host servers up and running in order to detect peers, setup media ports, etc. in order to establish initial handshake.
- Mar 2: Have p2p streaming setup and working along with captioning and transcripting (on client side).
- Mar 16: Facilitate multi-party video streaming using the host servers along with captioning and transcripting(on server side).
- Mar 23: Produce a finalized system including performance benchmarks, testing, tweaks, ui-polishing, etc.




