# remote-control

This a simple Javascript remote control I implemented to play with home automation.

![Alt text](/public/images/screenshot1.jpg?raw=true =250x "Device Screen")  ![Alt text](/public/images/screenshot2.jpg?raw=true =250x "Devices")

## Demo: Controlling Home Theater (old version)

[![Alt text](https://img.youtube.com/vi/wbnYjC6w0bA/0.jpg)](https://www.youtube.com/watch?v=wbnYjC6w0bA)

## Components

* Node.js (expressjs) REST API: abstracts interface with devices and appliances
* Mobile Web App (jQuery Mobile + Pug template engine): communicates with server via WebSockets
* Integration with iTach Wi-fi to IR