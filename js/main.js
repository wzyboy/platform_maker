const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'viewport',
        width: '100%',
        height: '100%'
    },
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

    player = this.physics.add.sprite(window.innerWidth / 2, 0, 'tiles', 1);

    this.input.on('pointerdown', e => {
        let cellX = Math.floor(e.downX / cellSize);
        let cellY = Math.floor(e.downY / cellSize);
        let tile = tiles.create(cellX * cellSize + cellSize / 2, cellY * cellSize + cellSize / 2, 'tiles', 1);

        tile.on('pointerdown', function () {
            console.log('hello');
            this.destroy();
        })
    });

    this.physics.add.collider(player, tiles);
}
function update() {

    cursors = this.input.keyboard.createCursorKeys();

    if (cursors.left.isDown) {
        player.setVelocityX(-160);

    }
    else if (cursors.right.isDown) {
        player.setVelocityX(160);

    }
    else {
        player.setVelocityX(0);

    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}
