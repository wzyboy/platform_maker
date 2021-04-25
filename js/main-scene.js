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
        camera.setBackgroundColor('RGBA(14, 4, 36, 1)');
        this.saveCameraLocation();


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
        this.input.on('pointerdown', (_e) => {
            this.pointerDown = true;
        });
        this.input.on('pointerup', (_e) => {
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

    update(_delta) {

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

            // clear all
            if (this.selectedTool == 5) {
                this.tileData = {};
                this.tiles.clear(true, true);
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
            let [_timecode, x, y] = item;
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
        let tile = this.tiles.create(cellX * cellSize + cellSize / 2, cellY * cellSize + cellSize / 2, 'tiles', 35);
        tile.mapKey = key;

        // selected tool erase click or drag
        tile.on('pointermove', () => {
            if (this.selectedTool === 1 && this.pointerDown) {
                delete this.tileData[tile.mapKey];
                tile.destroy();
                this.toggleNeighbourCollision(cellX, cellY);
            }
        });
        tile.on('pointerdown', () => {
            if (this.selectedTool === 1) {
                delete this.tileData[tile.mapKey];
                this.pointerDown = true;
                tile.destroy();
                this.toggleNeighbourCollision(cellX, cellY);
            }
        });

        tile.setInteractive();
        this.tileData[key] = tile;

        this.toggleNeighbourCollision(cellX, cellY);
    }


    toggleNeighbourCollision(x, y) {
        x = parseInt(x);
        y = parseInt(y);

        /**
         * C = center
         * U = up
         * D = down
         * L = left
         * R = right
         * 
         * UL = upper left
         * DL = downer left
         * 
         * t = tile exists
         * 
         * tUL = tile exists on upper left 
         */
        const keyC = `${x},${y}`;

        const keyU = `${x},${y - 1}`;
        const keyD = `${x},${y + 1}`;
        const keyL = `${x - 1},${y}`;
        const keyR = `${x + 1},${y}`;
        const keyUL = `${x - 1},${y - 1}`;
        const keyUR = `${x + 1},${y - 1}`;
        const keyDL = `${x - 1},${y + 1}`;
        const keyDR = `${x + 1},${y + 1}`;


        const tC = keyC in this.tileData;

        const tU = keyU in this.tileData;
        const tD = keyD in this.tileData;
        const tL = keyL in this.tileData;
        const tR = keyR in this.tileData;
        const tUL = keyUL in this.tileData;
        const tUR = keyUR in this.tileData;
        const tDL = keyDL in this.tileData;
        const tDR = keyDR in this.tileData;

        // console.log(` U:${keyU} D:${keyD} L:${keyL} R:${keyR}`);
        // console.log(` U:${tU} D:${tD} L:${tL} R:${tR}`);

        if (tC) {
            let tile = this.tileData[keyC];

            // set collision
            tile.body.checkCollision.up = !tU;
            tile.body.checkCollision.down = !tD;
            tile.body.checkCollision.left = !tL;
            tile.body.checkCollision.right = !tR;

            this.connectedTexture(keyC);
        }

        // other block's collisions
        if (tU) {
            this.tileData[keyU].body.checkCollision.down = !tC;
            this.connectedTexture(keyU);
        }
        if (tD) {
            this.tileData[keyD].body.checkCollision.up = !tC;
            this.connectedTexture(keyD);
        }
        if (tL) {
            this.tileData[keyL].body.checkCollision.right = !tC;
            this.connectedTexture(keyL);
        }
        if (tR) {
            this.tileData[keyR].body.checkCollision.left = !tC;
            this.connectedTexture(keyR);
        }

        if (tUL) this.connectedTexture(keyUL);
        if (tUR) this.connectedTexture(keyUR);
        if (tDL) this.connectedTexture(keyDL);
        if (tDR) this.connectedTexture(keyDR);
    }

    /**
     * 
     * @param {string} key a cell key in this format "x,y"
     */
    connectedTexture(keyC) {
        const tC = keyC in this.tileData;
        if (tC) {

            let [x, y] = keyC.split(',').map(d => parseInt(d));

            // console.log(x)
            // console.log(y)

            const keyU = `${x},${y - 1}`;
            const keyD = `${x},${y + 1}`;
            const keyL = `${x - 1},${y}`;
            const keyR = `${x + 1},${y}`;

            const keyUL = `${x - 1},${y - 1}`;
            const keyUR = `${x + 1},${y - 1}`;
            const keyDL = `${x - 1},${y + 1}`;
            const keyDR = `${x + 1},${y + 1}`;

            // is air at that location
            const tU = !(keyU in this.tileData);
            const tD = !(keyD in this.tileData);
            const tL = !(keyL in this.tileData);
            const tR = !(keyR in this.tileData);

            const tUL = !(keyUL in this.tileData);
            const tUR = !(keyUR in this.tileData);
            const tDL = !(keyDL in this.tileData);
            const tDR = !(keyDR in this.tileData);

            let tile = this.tileData[keyC];

            switch (true) {
                // air in every corner
                case !tU && !tD && !tL && !tR && tUL && tUR && tDL && tDR:
                    tile.setTexture('tiles', 36);
                    break;

                // t shapes with dirt
                case tUL && !tU && tUR && !tR && !tDR && !tD && !tDL && !tL:
                    tile.setTexture('tiles', 57);
                    break;
                case !tUL && !tU && tUR && !tR && tDR && !tD && !tDL && !tL:
                    tile.setTexture('tiles', 71);
                    break;
                case !tUL && !tU && !tUR && !tR && tDR && !tD && tDL && !tL:
                    tile.setTexture('tiles', 83);
                    break;
                case tUL && !tU && !tUR && !tR && !tDR && !tD && tDL && !tL:
                    tile.setTexture('tiles', 69);
                    break;


                // t shapes
                case tUL && !tU && tUR && !tR && tD && !tL:
                    tile.setTexture('tiles', 47);
                    break;
                case !tU && tUR && !tR && tDR && !tD && tL:
                    tile.setTexture('tiles', 48);
                    break;
                case tU && !tR && tDR && !tD && tDL && !tL:
                    tile.setTexture('tiles', 34);
                    break;
                case tUL && !tU && tR && !tD && tDL && !tL:
                    tile.setTexture('tiles', 49);
                    break;

                // half t vertical
                case !tU && tUR && !tR && !tDR && !tD && tL:
                    tile.setTexture('tiles', 54);
                    break;
                case tUL && !tU && tR && !tD && !tDL && !tL:
                    tile.setTexture('tiles', 55);
                    break;
                case !tU && !tUR && !tR && tDR && !tD && tL:
                    tile.setTexture('tiles', 67);
                    break;
                case !tUL && !tU && tR && !tD && tDL && !tL:
                    tile.setTexture('tiles', 68);
                    break;

                // half t horizontal
                case tU && !tR && !tDR && !tD && tDL && !tL:
                    tile.setTexture('tiles', 56);
                    break;
                case tU && !tR && tDR && !tD && !tDL && !tL:
                    tile.setTexture('tiles', 58);
                    break;
                case tUL && !tU && !tUR && !tR && tD && !tL:
                    tile.setTexture('tiles', 82);
                    break;
                case !tUL && !tU && tUR && !tR && tD && !tL:
                    tile.setTexture('tiles', 84);
                    break;



                // air everywhere
                case tU && tD && tL && tR:
                    tile.setTexture('tiles', 35);
                    break;


                // end caps
                case tD && tL && tR:
                    tile.setTexture('tiles', 46);
                    break;
                case tU && tL && tR:
                    tile.setTexture('tiles', 20);
                    break;
                case tU && tD && tR:
                    tile.setTexture('tiles', 23);
                    break;
                case tU && tD && tL:
                    tile.setTexture('tiles', 21);
                    break;

                // corner pieces with corner air
                case tU && tL && tDR:
                    tile.setTexture('tiles', 24);
                    break;
                case tU && tR && tDL:
                    tile.setTexture('tiles', 25);
                    break;
                case tD && tL && tUR:
                    tile.setTexture('tiles', 37);
                    break;
                case tD && tR && tUL:
                    tile.setTexture('tiles', 38);
                    break;

                // stick pieces
                case tU && tD:
                    tile.setTexture('tiles', 22);
                    break;
                case tR && tL:
                    tile.setTexture('tiles', 33);
                    break;

                // corner pieces
                case tU && tL:
                    tile.setTexture('tiles', 17);
                    break;
                case tU && tR:
                    tile.setTexture('tiles', 19);
                    break;
                case tD && tL:
                    tile.setTexture('tiles', 43);
                    break;
                case tD && tR:
                    tile.setTexture('tiles', 45);
                    break;






                // surface pieces
                case tU:
                    tile.setTexture('tiles', 18);
                    break;
                case tD:
                    tile.setTexture('tiles', 44);
                    break;
                case tL:
                    tile.setTexture('tiles', 30);
                    break;
                case tR:
                    tile.setTexture('tiles', 32);
                    break;


                // corner air
                case tUL:
                    tile.setTexture('tiles', 73);
                    break;
                case tUR:
                    tile.setTexture('tiles', 72);
                    break;
                case tDL:
                    tile.setTexture('tiles', 60);
                    break;
                case tDR:
                    tile.setTexture('tiles', 59);
                    break;

                // full dirt
                default:
                    tile.setTexture('tiles', 31);

            }

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
    saveCameraLocation() {
        this.oldCameraPosition = {
            x: this.cameras.main.scrollX,
            y: this.cameras.main.scrollY,
        }
    }
    startGame() {
        this.player.body.moves = true;
        this.playing = true;
        this.saveCameraLocation();
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
        if (this.oldCameraPosition == undefined) {
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
            // await this.sleep(100);
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
