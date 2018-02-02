import InputEngine from './InputEngine.js';
import GameEngine from './GameEngine.js';

console.log(new InputEngine());

const socket = io();

socket.on('connected', res => {
  console.log(res);
});
