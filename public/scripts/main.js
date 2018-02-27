import gGameEngine from './GameEngine.js';

window.init = () => {
  gGameEngine.load();  
}

const socket = io();

socket.on('connected', res => {
  console.log(res);
});
