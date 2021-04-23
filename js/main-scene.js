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

    create() {

        // set camera
        let camera = this.cameras.main;
        camera.zoom = 3;
        camera.setBackgroundColor('RGBA(135, 206, 235, 1)');


        // create tiles container
        this.tiles = this.physics.add.staticGroup();
        this.tileData = {};

        // create player
        this.placePlayer(camera.width / 2, camera.height / 2);
        this.player.body.moves = false;
        let playerSizeReduce = this.player.width / 5;
        this.player.body.setSize(
            this.player.width - playerSizeReduce,
            this.player.width - playerSizeReduce);
        this.player.body.offset = {
            x: playerSizeReduce / 2,
            y: playerSizeReduce
        };

        // this.player.body.setBodySize(
        //     this.player.width / 2 - playerSizeReduce,
        //     this.player.width / 2 - playerSizeReduce,
        //     playerSizeReduce,
        //     playerSizeReduce * 2);

        // start check collision between tiles and player
        this.physics.add.collider(this.player, this.tiles);


        // trail data: an array of (timecode, x, y)
        this.trailData = [];
        this.trailGraph = this.add.graphics();
        this.startTime = Date.now();
        this.trailGraphStale = true;
        this.trailSampleInterval = 100;
        this.trailSampleTime = Date.now();

        // pointer click event
        this.pointerDown = false;
        this.input.on('pointerdown', (e) => {
            this.pointerDown = true;
        });
        this.input.on('pointerup', (e) => {
            this.pointerDown = false;
        });



        // event listeners
        emitter.on('load-map', (mapDataJson) => this.loadMap(mapDataJson));

        emitter.on('bind-keys', () => this.unbindKeys());
        emitter.on('unbind-keys', () => this.bindKeys());

        emitter.on('stop-game', () => this.stopGame());
        emitter.on('start-game', () => this.startGame());

        emitter.on('get-map-data', (request) => emitter.emit('map-data', {
            json: this.getMapJson(),
            callback: request.callback,
            tabIndex: request.tabIndex,
        }));

        emitter.on('set-tool', (newTool) => this.selectedTool = newTool);

        // tell vue js scene finished loading
        emitter.emit('scene-load');
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


            // draw hisotry
            if (this.selectedTool === 4) {
                if (this.trailGraphStale) {
                    this.trailGraph.clear();
                    this.drawPlayerTrail();
                    this.trailGraphStale = true;
                }
            }

        }
        this.previousPointerLoc = pointer.position.clone();
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
    }

    recordPlayerPos() {
        let pos = `${this.player.x},${this.player.y}`;
        if (pos !== this.previousPlayerPos && (Date.now() - this.trailSampleTime > this.trailSampleInterval)) {
            let timecode = Date.now() - this.startTime;
            // console.log([timecode, this.player.x, this.player.y]);
            this.trailData.push([timecode, this.player.x, this.player.y]);
            this.trailGraphStale = true;
            this.trailSampleTime = Date.now();
        }
    }

    drawPlayerTrail() {

        this.trailGraph.lineStyle(1, 0xFF00FF, 0.2);
        this.trailGraph.beginPath();

        // lineTo every dot in trailData
        this.trailData.forEach((item) => {
            let [timecode, x, y] = item;
            this.trailGraph.lineTo(x, y);
        })

        this.trailGraph.strokePath();

    }

    getMapJson() {
        let mapData = {};


        mapData.playerData = {
            x: this.player.x,
            y: this.player.y,
        }

        let keys = Object.keys(this.tileData);
        mapData.tileData = keys.map(key => {
            let split = key.split(',');
            return {
                x: split[0],
                y: split[1],
            }
        });

        return JSON.stringify(mapData);
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
            }
        });
        tile.on('pointerdown', () => {
            if (this.selectedTool === 1) {
                this.toggleNeighbourCollision(cellX, cellY);
                delete this.tileData[tile.mapKey];
                this.pointerDown = true;
                tile.destroy();
            }
        });

        tile.setInteractive();
        this.tileData[key] = tile;
        
        this.toggleNeighbourCollision(cellX, cellY);
    }


    toggleNeighbourCollision(x, y) {
        const keyC = `${x},${y}`;

        const keyU = `${x},${y - 1}`
        const keyD = `${x},${y + 1}`
        const keyL = `${x - 1},${y}`
        const keyR = `${x + 1},${y}`


        const blockOnC = keyC in this.tileData

        const blockOnU = keyU in this.tileData
        const blockOnD = keyD in this.tileData
        const blockOnL = keyL in this.tileData
        const blockOnR = keyR in this.tileData
 

        if (blockOnC) {
            let tile = this.tileData[keyC];
            tile.body.checkCollision.up = !blockOnU;
            tile.body.checkCollision.down = !blockOnD;
            tile.body.checkCollision.left = !blockOnL;
            tile.body.checkCollision.right = !blockOnR;
        }

        if (blockOnU) {
            this.tileData[keyU].body.checkCollision.down = !blockOnC;
        }
        if (blockOnD) {
            this.tileData[keyD].body.checkCollision.up = !blockOnC;
        }
        if (blockOnL) {
            this.tileData[keyL].body.checkCollision.right = !blockOnC;
        }
        if (blockOnR) {
            this.tileData[keyR].body.checkCollision.left = !blockOnC;
        }
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

    startGame() {
        this.player.body.moves = true;
        this.playing = true;
        this.oldCameraPosition = {
            x: this.cameras.main.scrollX,
            y: this.cameras.main.scrollY,
        }
        this.cameras.main.startFollow(this.player, false, .01, .01);
    }
    stopGame() {
        this.playing = false;
        this.player.body.moves = false;
        this.player.x = this.player.startPosition.x;
        this.player.y = this.player.startPosition.y;
        this.player.setVelocityX(0);
        this.player.setVelocityY(0);

        this.cameras.main.stopFollow(this.player);
        if (this.oldCameraPosition !== undefined) {
            this.cameras.main.scrollX = this.oldCameraPosition.x;
            this.cameras.main.scrollY = this.oldCameraPosition.y;
            delete this.oldCameraPosition;
        }
    }

    sleep(delay) {
        return new Promise((resolve) => setTimeout(resolve, delay));
    }

    async loadMap(mapDataJson) {

        // delete old amp
        for (let key in this.tileData) {
            this.tileData[key].destroy();
            delete this.tileData[key];
        }

        // add in new tiles
        let mapData = JSON.parse(mapDataJson);

        let tileData = mapData.tileData;
        for (let tile of tileData) {

            // slow loading
            // await this.sleep(1);
            this.newTile(tile.x, tile.y);
        }

        // player attributes
        this.placePlayer(mapData.playerData.x, mapData.playerData.y);
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
}
