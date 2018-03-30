import gInputEngine from './InputEngine.js';
import Tile from './Tile.js';
import Princess from './Princess.js';
import Player from './Player.js';
import Wood from './Wood.js';
import Enemy from './Enemy.js';

class GameEngine {
    constructor() {
        // Canvas
        this.stage = null;

        // Environment Parameters
        this.fps = 60;
        this.tileSize = 32;
        this.tilesX = 41;
        this.tilesY = 21;
        this.size = {
            w: this.tileSize * (this.tilesX + 4),
            h: this.tileSize * this.tilesY
        };

        // Asset Objects
        this.playerBoyImg = null;
        this.princessImg = null;
        this.enemyImg = null;
        this.woodImg = null;
        this.tilesImgs = {};

        // Environment Arrays
        this.players = [];
        this.enemies = [];        
        this.woods = [];
        this.tiles = [];
        this.grassTiles = [];
        this.towerEdgeTiles = [];
    }

    load() {
        // Init canvas
        this.stage = new createjs.Stage("game");

        // Load assets
        const queue = new createjs.LoadQueue();
        const that = this;
        queue.addEventListener('complete', () => {
            that.playerBoyImg = queue.getResult('player');
            that.princessImg = queue.getResult('princess');
            that.enemyImg = queue.getResult('enemy');
            that.woodImg = queue.getResult('wood');
            that.tilesImgs.grass = queue.getResult('tile_grass');
            that.tilesImgs.wall = queue.getResult('tile_wall');
            that.setup();
        });
        queue.loadManifest([
            { id: 'player', src: 'img/george.png' },
            { id: 'princess', src: 'img/betty.png' },
            { id: 'enemy', src: 'img/dino.png' },
            { id: 'wood', src: 'img/wood.png' },
            { id: 'tile_grass', src: 'img/tile_grass.png' },
            { id: 'tile_wall', src: 'img/tile_wall.png' }
        ]);
    }

    setup() {
        // Init input engine
        if (!gInputEngine.bindings.length) {
            gInputEngine.setup();
        }

        // Reset environment states
        this.players = [];
        this.enemies = [];
        this.woods = [];
        this.tiles = [];
        this.grassTiles = [];
        this.towerEdgeTiles = [];

        // Draw tiles
        this.drawTiles();

        // Add wood logs on the map
        this.drawWoods();

        // Spawn yourself
        this.spawnPlayers();

        //Release the kraken!
        this.spawnEnemies();

        // Lock the princess in the tower >:(
        new Princess({ x: this.tilesX + 1, y: Math.floor(this.tilesY / 2) });

        // Start loop
        if (!createjs.Ticker.hasEventListener('tick')) {
            createjs.Ticker.addEventListener('tick', gGameEngine.update);
            createjs.Ticker.setFPS(this.fps);
        }
    }

    update() {
        // Player
        for (let i = 0; i < gGameEngine.players.length; i++) {
            const player = gGameEngine.players[i];
            player.update();
        }

        // Enemies
        for (let i = 0; i < gGameEngine.enemies.length; i++) {
            const enemy = gGameEngine.enemies[i];
            enemy.update();
        }

        // Stage
        gGameEngine.stage.update();
    }

    generateMaze(x, y) {

        // Establish variables and starting grid
        const totalCells = x * y;
        const cells = new Array();
        const unvis = new Array();
        for (let i = 0; i < y; i++) {
          cells[i] = new Array();
          unvis[i] = new Array();
          for (let j = 0; j < x; j++) {
            cells[i][j] = [0, 0, 0, 0];
            unvis[i][j] = true;
          }
        }
    
        // Set a random position to start from
        let currentCell = [Math.floor(Math.random() * y), Math.floor(Math.random() * x)];
        const path = [currentCell];
        unvis[currentCell[0]][currentCell[1]] = false;
        let visited = 1;
    
        // Loop through all available cell positions
        while (visited < totalCells) {
          // Determine neighboring cells
          const pot = [[currentCell[0] - 1, currentCell[1], 0, 2],
          [currentCell[0], currentCell[1] + 1, 1, 3],
          [currentCell[0] + 1, currentCell[1], 2, 0],
          [currentCell[0], currentCell[1] - 1, 3, 1]];
          const neighbors = new Array();
    
          // Determine if each neighboring cell is in game grid, and whether it has already been checked
          for (let l = 0; l < 4; l++) {
            if (
                pot[l][0] > -1 && 
                pot[l][0] < y && 
                pot[l][1] > -1 && 
                pot[l][1] < x && 
                unvis[pot[l][0]][pot[l][1]]
            ) { 
                neighbors.push(pot[l]); 
            }
          }
    
          // If at least one active neighboring cell has been found
          if (neighbors.length) {
            // Choose one of the neighbors at random
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    
            // Remove the wall between the current cell and the chosen neighboring cell
            cells[currentCell[0]][currentCell[1]][next[2]] = 1;
            cells[next[0]][next[1]][next[3]] = 1;
    
            // Mark the neighbor as visited, and set it as the current cell
            unvis[next[0]][next[1]] = false;
            visited++;
            currentCell = [next[0], next[1]];
            path.push(currentCell);
          }
          // Otherwise go back up a step and keep going
          else {
            currentCell = path.pop();
          }
        }
        return cells;
      }

    drawTiles() {
        const mazeCells = this.generateMaze(20,10);

        for (let i = 0; i < this.tilesY; i++) {
            for (let j = 0; j < this.tilesX; j++) {
                if (
                    i == 0 ||
                    j == 0 ||
                    i == this.tilesY - 1 ||
                    j == this.tilesX - 1 ||
                    (j % 2 == 0 && i % 2 == 0)
                    ) {
                    // Wall tiles
                    const tile = new Tile('wall', { x: j, y: i });
                    this.stage.addChild(tile.bmp);
                    this.tiles.push(tile);
                } else if (j % 2 == 1 && i % 2 == 1 && j !== this.tilesX - 1 && i !== this.tilesY - 1){
                    // Grass tiles
                    const tile = new Tile('grass', { x: j, y: i });
                    this.stage.addChild(tile.bmp);
                    this.grassTiles.push(tile);
                }
            }
        }

        const verticalTowerEdge = (Math.floor(this.tilesY / 2)) - 2;

        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 4; j++) {
                if (
                    i === 0 ||
                    j === 0 ||
                    i >= 4 ||
                    j === 3
                    ) {
                    const tile = new Tile('wall', { x: this.tilesX - 1 + j, y: verticalTowerEdge + i });
                    if (j === 0) {
                        this.towerEdgeTiles.push(tile);
                    } else {
                        this.stage.addChild(tile.bmp);
                    }
                } else {
                    const tile = new Tile('grass', { x: this.tilesX - 1 + j, y: verticalTowerEdge + i });
                    this.stage.addChild(tile.bmp);
                }
            }
        }

        for (let i = 0; i < this.tilesY; i++) {
            for (let j = 0; j < 4; j++) {
                if (i < verticalTowerEdge || i > verticalTowerEdge + 5) {
                    const tile = new Tile('grass', { x: this.tilesX + j, y: i });
                    this.stage.addChild(tile.bmp);
                }
            }
        }

        for (let i = 0; i < mazeCells.length; i++) {
            for (let j = 0; j < mazeCells[0].length; j++) {
                if (mazeCells[i][j][1] === 0) {
                    // Wall tiles
                    const tile = new Tile('wall', { x: ((2 * j) + 2), y: ((2 * i) + 1) });
                    this.stage.addChild(tile.bmp);
                    this.tiles.push(tile);
                } else {
                    // Grass tiles
                    const tile = new Tile('grass', { x: ((2 * j) + 2), y: ((2 * i) + 1) });
                    this.stage.addChild(tile.bmp);
                    this.grassTiles.push(tile);
                }
                if (mazeCells[i][j][2] === 0) {
                    // Wall tiles
                    const tile = new Tile('wall', { x: ((2 * j) + 1), y: ((2 * i) + 2) });
                    this.stage.addChild(tile.bmp);
                    this.tiles.push(tile);
                } else {
                    // Grass tiles
                    const tile = new Tile('grass', { x: ((2 * j) + 1), y: ((2 * i) + 2) });
                    this.stage.addChild(tile.bmp);
                    this.grassTiles.push(tile);
                }
            }
        }
    }

    drawWoods() {
        const available = [];

        for (let i = 0; i < this.grassTiles.length; i++) {
            available.push(this.grassTiles[i]);
        }

        available.sort(() => {
            return 0.5 - Math.random();
        });

        for(let i = 0; i < 5; i ++) {
            const tile = available[i];
            const wood = new Wood(tile.position);
            this.woods.push(wood);
        }
    }

    spawnPlayers() {
        this.players= [];

        const player = new Player({x: 1, y: 1});
        this.players.push(player);
    }

    spawnEnemies() {
        this.enemies = [];
        const availablePathwaysStart = [];
    
        this.grassTiles.sort((a, b) => {
          if (a.position.y == b.position.y) return a.position.x - b.position.x;
          return a.position.y - b.position.y;}
        );
    
        //get pathways with 5 available tiles
        for(let i = 0; i < this.grassTiles.length - 5; i++) {
          if (
            (this.grassTiles[i].position.y === this.grassTiles[i + 1].position.y &&
            this.grassTiles[i].position.y === this.grassTiles[i + 2].position.y &&
            this.grassTiles[i].position.y === this.grassTiles[i + 3].position.y &&
            this.grassTiles[i].position.y === this.grassTiles[i + 4].position.y) &&
    
            (this.grassTiles[i + 4].position.x - this.grassTiles[i + 3].position.x === 1 &&
            this.grassTiles[i + 3].position.x - this.grassTiles[i + 2].position.x === 1 &&
            this.grassTiles[i + 2].position.x - this.grassTiles[i + 1].position.x === 1 &&
            this.grassTiles[i + 1].position.x - this.grassTiles[i].position.x === 1)
          ) {
              availablePathwaysStart.push(i+4);
              i += 5;
            }
        }
    
        // Sort tiles randomly
        availablePathwaysStart.sort(() => {
          return 0.5 - Math.random();
        });
    
        for (let i = 0; i < 3; i++) {
          const startingPosition = this.grassTiles[availablePathwaysStart[i]].position;
          const enemy = new Enemy(startingPosition);
          this.enemies.push(enemy);
        }
    }

    
    // Checks whether two rectangles intersect.
    intersectRect(a, b) {
        return (
            a.left <= b.right &&
            b.left <= a.right &&
            a.top <= b.bottom &&
            b.top <= a.bottom
        );
    }

    
    // Returns tile at given position.
    getTile(position) {
        for (let i = 0; i < this.tiles.length; i++) {
            const tile = this.tiles[i];
            if (tile.position.x == position.x && tile.position.y == position.y) {
                return tile;
            }
        }
    }

    // Returns tile material at given position.
    getTileMaterial(position) {
        const tile = this.getTile(position);
        return tile ? tile.material : 'grass';
    }
}

const gGameEngine = new GameEngine();
export default gGameEngine;