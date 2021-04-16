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
                {
                    name: 'draw history',
                    icon: 'history'
                },
            ],
            currentTab: 0,
            tabs: [
                {
                    name: 'Initial',
                    playing: false,
                    mapData: {},
                    fromVersion: -1,
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
        currentTab(newIndex, oldIndex) {

            this.stopGame(oldIndex);

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
        closeTab(index) {

            if (this.currentTab > this.tabs.length - 2) {
                this.currentTab = this.tabs.length - 2;
            }
            this.tabs.splice(index, 1);

        },
        makeNewVersion() {
            let fromVersion = this.tabs[this.currentTab].fromVersion;
            let version = {
                version: this.versions.length + 1,
                name: `version ${this.versions.length + 1}`,
                mapData: JSON.parse(JSON.stringify(this.tabs[this.currentTab].mapData)),
                createdDate: new Date(Date.now()),
                fromVersion: fromVersion === -1 ? null : fromVersion,
            }
            this.versions.push(version);
        },
        newTab(index) {
            this.tabs.push({
                name: `from: ${this.versions[index].name}`,
                playing: false,
                mapData: this.versions[index].mapData,
                fromVersion: this.versions[index].version,
            });
            this.currentTab = this.tabs.length - 1;
            this.versionView = false;
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
