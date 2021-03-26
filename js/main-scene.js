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
        let camera = this.cameras.main;

        this.tiles = this.physics.add.staticGroup();

        this.placePlayer(camera.width / 2, camera.height / 2);
        this.player.body.moves = false;

        this.physics.add.collider(this.player, this.tiles);
        // this.cameras.main.startFollow(this.player, false, .1, .1);
        camera.zoom = 3;


        this.input.on('pointerdown', (e) => {
            if (this.selectedTool === 3) {
                this.placePlayer(e.worldX, e.worldY);
            }
        })
        emitter.emit('scene-load', this);

    }

    placePlayer(x, y) {
        if (this.player === undefined) {
            this.player = this.physics.add.sprite(0, 0, 'tiles', 13);
        }12
        let cellSize = this.cellSize;
        let cellX = Math.floor(x / cellSize);
        let cellY = Math.floor(y / cellSize);

        this.player.x = cellX * cellSize + cellSize / 2;
        this.player.y = cellY * cellSize + cellSize / 2;

        this.player.startPosition = {
            x: this.player.x,
            y: this.player.y,
        }
    }

    update(delta) {
        this.playerMovement();


        let pointer = this.input.mousePointer;

        if (pointer.isDown) {
            if (this.selectedTool === 2) {

                let camera = this.cameras.main;
                camera.scrollX -= (pointer.x - this.previousPointerLoc.x) / camera.zoom;
                camera.scrollY -= (pointer.y - this.previousPointerLoc.y) / camera.zoom;
            }

            // selected tool = pen
            if (this.selectedTool === 0) {

                let cellSize = this.cellSize;
                let cellX = Math.floor(pointer.worldX / cellSize);
                let cellY = Math.floor(pointer.worldY / cellSize);

                let key = cellX + ',' + cellY;
                if (!(cellX + ',' + cellY in this.levelData)) {
                    let tile = this.tiles.create(cellX * cellSize + cellSize / 2, cellY * cellSize + cellSize / 2, 'tiles', 0);

                    // selected tool erase
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
            this.player.flipX = true;
        }
        else if (this.keyD.isDown) {
            this.player.setVelocityX(160);
            this.player.flipX = false;

        }
        else {
            this.player.setVelocityX(0);

        }
        if (this.keyW.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-230);
        }
    }

    playGame() {
        this.player.body.moves = true;
    }
    stopGame() {
        this.player.body.moves = false;
        this.player.x = this.player.startPosition.x;
        this.player.y = this.player.startPosition.y;
    }
}