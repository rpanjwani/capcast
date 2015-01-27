# capCast
A video conferencing app that produces speech to text captions in real time. This project will comprise of combined project work for Csc 462/562, Csc 466/566, and Csc 461/561.

## Usage
CapCast will allow video conferencing using a web-browser while producing captions in real time. This can aid in better communication between users with or without special needs. 
 
## Contributors
- Riz Panjwani
- Harsh Dawar
- Sumit Kadyan
- Khushbu Gandhi
 
## Key Features
CapCast will allow a user to do the following:
- generate a link for the video conference that users can share to join the conference.
- call one or more users.
- turn captioning on/off.
- turn translations on/off.

## Major Components

We have broken down the project into the following components that correspond to the appropriate course work below.

### Peer to Peer Clients (csc 466 / 566 - P2P Overlay Component)
A client is simply a browser running on a user's computer. If the call is one-to-one (only two clients connected to each other), then capCast will use a P2P connection using WebRTC in order to stream the video conference. Otherwise, it will switch to using a capCast host server to carry out the communication.

### CapCast Host Servers (csc 462 / 562 - Distributed Systems Component)
CapCast host servers will be a distributed system that host the application. The system will facilitate a call between users. If there are two clients, the system will offload the streaming to the p2p model, where the clients will handle the streaming amongst themselves. When a call involves more than two clients, the server will facilitate the video streaming. We will simulate delays, network loss, and node fault to demonstrate the system's ability to cope with failure.

### Video Streaming and Captioning (csc 461 / 561 - Multimedia Systems Component)
Video conferencing will be done using HTML5 and WebRTC. Real-time speech to text captioning will be done using the Google Web Speech API.


## Challenges

## Milestones




