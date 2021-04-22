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
            debug: true
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
            selectedTool: 0,
            tools: [
                {
                    name: 'draw',
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
                    name: 'trail',
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
                emitter.emit('bind-keys');
            } else {
                emitter.emit('unbind-keys');
            }
        },
        currentTab(newIndex, oldIndex) {

            // check if the old tab is closed
            if (this.tabs[oldIndex] !== undefined) {
                this.stopGame(oldIndex);
            }

            // save old map's data
            emitter.emit('get-map-data', {
                callback: this.startNewTab,
                tabIndex: oldIndex,
            })

        }
    },
    methods: {
        startNewTab() {
            this.stopGame(this.currentTab);
            emitter.emit('load-map', this.tabs[this.currentTab].mapData);
        },
        setTool(newTool) {
            emitter.emit('set-tool', newTool);
        },
        playGame(index) {
            this.tabs[index].playing = true;
            emitter.emit('start-game');
        },
        stopGame(index) {
            this.tabs[index].playing = false;
            emitter.emit('stop-game');
        },
        closeTab(index) {

            if (this.currentTab > this.tabs.length - 2) {
                this.currentTab = this.tabs.length - 2;
            }

            this.tabs.splice(index, 1);

        },
        makeNewVersion() {
            emitter.emit('get-map-data', {
                callback: this.finalizeVersion,
                tabIndex: this.currentTab,
            });
        },
        finalizeVersion() {
            let fromVersion = this.tabs[this.currentTab].fromVersion;
            let version = {
                version: this.versions.length + 1,
                name: `version ${this.versions.length + 1}`,
                mapData: this.tabs[this.currentTab].mapData,
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
        emitter.on('scene-load', () => {
            this.setTool(this.selectedTool);
        });
        emitter.on('map-data', response => {
            this.tabs[response.tabIndex].mapData = response.json;
            response.callback(response.tabIndex);
        });
    }
}

let ui = Vue.createApp(UI).mount('#ui')
