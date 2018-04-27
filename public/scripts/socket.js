const socket = io();

socket.on('connected', (res) => {
	console.log(res);
});


socket.on('waiting-opponent', res => {
	console.log('waiting oponent');
});

socket.on('start-game', () => {
	console.log('game start');
})

export default socket;