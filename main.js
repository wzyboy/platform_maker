const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};
const game = new Phaser.Game(config);

const cellSize = 16;
let tiles;
let player;

function preload() {
    this.load.spritesheet(
        'tiles',
        'assets/tilemap.png',
        {
            frameWidth: 16,
            frameHeight: 16,
        });
}
function create() {

    tiles = this.physics.add.staticGroup();

    player = this.physics.add.sprite(window.innerWidth/2, 0, 'tiles', 1)

    this.input.on('pointerdown', e => {
        let cellX = Math.floor(e.downX / cellSize);
        let cellY = Math.floor(e.downY / cellSize);
        tiles.create(cellX * cellSize + cellSize/2, cellY * cellSize + cellSize/2, 'tiles', 1);
    });

    this.physics.add.collider(player, tiles);
}
function update() {
}