class MainScene extends Phaser.Scene {
    constructor() {
        super({key: "MainScene"})
        this.cellSize = 16;
        this.tiles;
        this.player;
    }
    
    preload() {
        this.load.spritesheet(
            'tiles',
            'assets/tilemap.png',
            {
                frameWidth: 16,
                frameHeight: 16,
            });
        
            this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
            this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
            this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    }
    create() {
    
        this.tiles = this.physics.add.staticGroup();
    
        this.player = this.physics.add.sprite(window.innerWidth / 2, 0, 'tiles', 0);
    
        this.input.on('pointerdown', e => {
            let cellSize = this.cellSize;
            let cellX = Math.floor(e.downX / cellSize);
            let cellY = Math.floor(e.downY / cellSize);
            let tile = this.tiles.create(cellX * cellSize + cellSize / 2, cellY * cellSize + cellSize / 2, 'tiles', 0);
    
            tile.on('pointerdown', function () {
                this.destroy();
            });
            tile.setInteractive();
        });
    
        this.physics.add.collider(this.player, this.tiles);
    }
    update(delta) {
        this.playerMovement();
        
    }
    
    playerMovement() {
    
        if (this.keyA.isDown) {
            this.player.setVelocityX(-160);
    
        }
        else if (this.keyD.isDown) {
            this.player.setVelocityX(160);
    
        }
        else {
            this.player.setVelocityX(0);
    
        }
        if (this.keyW.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }    
    }

}