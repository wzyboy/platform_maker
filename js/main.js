const emitter = mitt();
const config = {
    type: Phaser.AUTO,
    // pixelArt: true,
    antialias: false,
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
            // debug: true
        }
    },
    scene: [
        MainScene,
    ]
};
const game = new Phaser.Game(config);

const gameStatus = {

};


const UI = {
    data() {
        return {
            scene: null,
            selectedTool: -1,
            tools: [
                {
                    name: 'edit',
                    icon: 'pen'
                },
                {
                    name: 'erase',
                    icon: 'eraser'
                },
                {
                    name: 'pan',
                    icon: 'arrows-alt'
                },
                {
                    name: 'start point',
                    icon: 'sign-in-alt'
                },
            ],
            currentTab: 0,
            tabs: [
                {
                    name: 'Version 1',
                    playing: false,
                    mapData: {},
                }
            ],
            versions: [],
            versionView: false,
        }
    },
    watch: {
        selectedTool(newTool) {
            this.setTool(newTool);
        },
        versionView(newStatus) {
            if (newStatus) {
                this.scene.unbindKeys();
            } else {
                this.scene.bindKeys();
            }
        },
        currentTab(newIndex) {
            let tab = this.tabs[newIndex];
            this.scene.loadMap(tab.mapData);
        }
    },
    methods: {
        setTool(newTool) {
            if (this.scene) {
                this.scene.selectedTool = newTool;
            }
        },
        playGame(index) {
            this.tabs[index].playing = true;
            this.scene.playGame();
        },
        stopGame(index) {
            this.tabs[index].playing = false;
            this.scene.stopGame();
        },
        makeNewVersion() {
            let version = {
                version: this.versions.length + 1,
                name: '',
                mapData: JSON.parse(JSON.stringify(this.tabs[this.currentTab].mapData))
            }
            this.versions.push(version);
        },
        newTab(index) {
            this.tabs.push({
                name: this.versions[index].name,
                playing: false,
                mapData: this.versions[index].mapData,
            })
        }
    },
    mounted() {
        this.selectedTool = 0;
        emitter.on('scene-load', scene => {
            this.scene = scene;
            this.setTool(this.selectedTool);
        });
        emitter.on('level-data-changed', mapInfo => {
            this.tabs[this.currentTab].mapData.playerData = {
                x: mapInfo.playerData.x,
                y: mapInfo.playerData.y,
            }

            let keys = Object.keys(mapInfo.tileData);
            this.tabs[this.currentTab].mapData.tileData = keys.map(key => {
                let split = key.split(',');
                return {
                    x: split[0],
                    y: split[1],
                }
            });
        })
    }
}

let ui = Vue.createApp(UI).mount('#ui')