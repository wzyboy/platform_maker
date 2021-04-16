class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" })
        this.cellSize = 16;

        this.selectedTool = -1;
        this.playing = false;
    }

    preload() {
        this.load.spritesheet(
            'tiles',
            'assets/tilemap.png',
            {
                frameWidth: 16,
                frameHeight: 16,
            });

        this.bindKeys();
    }
    bindKeys() {
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }
    unbindKeys() {
        this.input.keyboard.clearCaptures();
    }
    create() {

        // set camera
        let camera = this.cameras.main;
        camera.zoom = 3;
        camera.setBackgroundColor('RGBA(135, 206, 235, 1)');


        // create tiles container
        this.tiles = this.physics.add.staticGroup();
        this.tileData = {};

        // trail data: an array of (timecode, pos)
        this.trailData = [];
        this.startTime = Date.now();

        // create players
        this.placePlayer(camera.width / 2, camera.height / 2);
        this.player.body.moves = false;

        // check collision between tiles and player
        this.physics.add.collider(this.player, this.tiles);

        // pointer click event
        this.pointerDown = false;
        this.input.on('pointerdown', (e) => {
            this.pointerDown = true;
        });
        this.input.on('pointerup', (e) => {
            this.pointerDown = false;
        });

        // tell vue js scene finished loading
        emitter.emit('scene-load', this);
        this.mapEdited();
    }

    placePlayer(x, y) {
        let player = this.player;
        if (player === undefined) {
            player = this.physics.add.sprite(0, 0, 'tiles', 13);
            // player.setCircle(player.displayWidth / 2);
            this.player = player;
        }
        let cellSize = this.cellSize;
        let cellX = Math.floor(x / cellSize);
        let cellY = Math.floor(y / cellSize);

        player.x = cellX * cellSize + cellSize / 2;
        player.y = cellY * cellSize + cellSize / 2;

        this.player.setVelocityX(0);
        this.player.setVelocityY(0);

        player.startPosition = {
            x: player.x,
            y: player.y,
        }
        this.mapEdited();
    }

    recordPlayerPos() {
        let pos = `${this.player.x},${this.player.y}`;
        if (pos !== this.previousPlayerPos) {
            let timecode = Date.now() - this.startTime;
            console.log([timecode, pos]);
            this.trailData.push([timecode, pos]);
        }
    }

    update(delta) {

        if (this.playing) {
            this.playerMovement();
        }


        let pointer = this.input.mousePointer;

        if (this.pointerDown) {

            // selected tool = pen
            if (this.selectedTool === 0) {


                let cellSize = this.cellSize;
                let cellX = Math.floor(pointer.worldX / cellSize);
                let cellY = Math.floor(pointer.worldY / cellSize);

                // hashmap key
                let key = cellX + ',' + cellY;


                if (!(key in this.tileData)) {
                    this.newTile(cellX, cellY);
                    this.mapEdited();
                }
            }

            if (this.selectedTool === 2) {

                let camera = this.cameras.main;
                camera.scrollX -= (pointer.x - this.previousPointerLoc.x) / camera.zoom;
                camera.scrollY -= (pointer.y - this.previousPointerLoc.y) / camera.zoom;
            }

            // selected tool start point
            if (this.selectedTool === 3) {
                this.placePlayer(pointer.worldX, pointer.worldY);
            }

        }
        this.previousPointerLoc = pointer.position.clone();
    }
    mapEdited() {
        emitter.emit('level-data-changed', {
            tileData: this.tileData,
            playerData: this.player,
        });
    }

    newTile(cellX, cellY) {
        let key = cellX + ',' + cellY;
        let cellSize = this.cellSize;
        let tile = this.tiles.create(cellX * cellSize + cellSize / 2, cellY * cellSize + cellSize / 2, 'tiles', 0);
        tile.mapKey = key;

        // selected tool erase click or drag
        tile.on('pointermove', () => {
            if (this.selectedTool === 1 && this.pointerDown) {
                this.toggleNeighbourCollision(cellX, cellY);
                delete this.tileData[tile.mapKey];
                tile.destroy();
                this.mapEdited();
            }
        });
        tile.on('pointerdown', () => {
            if (this.selectedTool === 1) {
                this.toggleNeighbourCollision(cellX, cellY);
                delete this.tileData[tile.mapKey];
                this.pointerDown = true;
                tile.destroy();
                this.mapEdited();
            }
        });

        tile.setInteractive();
        this.tileData[key] = tile;
        this.toggleNeighbourCollision(cellX, cellY);

    }


    toggleNeighbourCollision(x, y) {
        const ntop = `${x},${y-1}`
        const nleft = `${x-1},${y}`
        const nright = `${x+1},${y}`
        const ndown = `${x},${y+1}`

        //let neighbours = [ ntop, nleft, nright, ndown ]
        //console.log(neighbours);

        if (ntop in this.tileData) {
            this.tileData[ntop].body.checkCollision.down ^= true
        } else if (nleft in this.tileData) {
            this.tileData[nleft].body.checkCollision.right ^= true
        } else if (nright in this.tileData) {
            this.tileData[nright].body.checkCollision.left ^= true
        } else if (ndown in this.tileData) {
            this.tileData[ndown].body.checkCollision.top ^= true
        }
        //console.log(this.tileData);
    }

    playerMovement() {

        if (this.keyA.isDown) {
            this.player.setVelocityX(-160);
            this.player.flipX = true;
            this.recordPlayerPos();
        }
        else if (this.keyD.isDown) {
            this.player.setVelocityX(160);
            this.player.flipX = false;
            this.recordPlayerPos();

        }
        else {
            this.player.setVelocityX(0);
            this.recordPlayerPos();

        }
        if (this.keyW.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-230);
            this.recordPlayerPos();
        }

        this.previousPlayerPos = `${this.player.x},${this.player.y}`;
    }

    playGame() {
        this.player.body.moves = true;
        this.playing = true;
    }
    stopGame() {
        this.playing = false;
        this.player.body.moves = false;
        this.player.x = this.player.startPosition.x;
        this.player.y = this.player.startPosition.y;
        this.player.setVelocityX(0);
        this.player.setVelocityY(0);
    }

    loadMap(mapData) {
        for (let key in this.tileData) {
            this.tileData[key].destroy();
        }
        this.tileData = {};

        let tileData = mapData.tileData;
        tileData.forEach(tile => {
            this.newTile(tile.x, tile.y);
        });
    }
}
