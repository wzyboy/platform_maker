class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" })
        this.cellSize = 16;

        this.levelData = {};

        this.selectedTool = -1;
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

        // this.player = this.physics.add.sprite(window.innerWidth / 2, 0, 'tiles', 0);
        // this.physics.add.collider(this.player, this.tiles);
        // this.cameras.main.startFollow(this.player, false, .1, .1);
        // this.cameras.main.zoom = 2;

        emitter.emit('scene-load', this);

    }
    update(delta) {
        // this.playerMovement();
        let pointer = this.input.mousePointer;

        if (pointer.isDown) {
            if (this.selectedTool === 2) {

                this.cameras.main.scrollX -= pointer.x - this.previousPointerLoc.x;
                this.cameras.main.scrollY -= pointer.y - this.previousPointerLoc.y;
            }

            // selected tool = pen
            if (this.selectedTool === 0) {
                
                let cellSize = this.cellSize;
                let cellX = Math.floor((pointer.worldX) / cellSize);
                let cellY = Math.floor((pointer.worldY) / cellSize);

                let key = cellX + ',' + cellY;
                if (!(cellX + ',' + cellY in this.levelData)) {
                    let tile = this.tiles.create(cellX * cellSize + cellSize / 2, cellY * cellSize + cellSize / 2, 'tiles', 0);

                    tile.on('pointermove', () => {
                        if (this.selectedTool === 1 && this.input.mousePointer.isDown) {
                            tile.destroy();
                        }
                    });
                    tile.on('pointerdown', () => {
                        if (this.selectedTool === 1) {
                            tile.destroy();
                        }
                    });
                    tile.setInteractive();

                    this.levelData[key] = tile;
                }
            }
        }
        this.previousPointerLoc = pointer.position.clone();
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