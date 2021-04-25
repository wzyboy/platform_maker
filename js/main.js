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

let vue = Vue.createApp({
    data() {
        return {
            selectedTool: 0,
            tools: [
                {
                    name: 'draw',
                    icon: 'pen',
                    icon_img: 'tool_build.png'
                },
                {
                    name: 'erase',
                    icon: 'eraser',
                    icon_img: 'tool_remove.png'
                },
                {
                    name: 'pan',
                    icon: 'arrows-alt',
                    icon_img: 'tool_pan.png'
                },
                {
                    name: 'start point',
                    icon: 'sign-in-alt',
                    icon_img: 'tool_start_point.png'
                },
                {
                    name: 'trail',
                    icon: 'history',
                    icon_img: 'tool_trail.png'
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
            showDropdownButtons: false,
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
        currentTab(_newIndex, oldIndex) {
            // tab id changed
            // stop old game if it is running
            // check if the old tab is closed
            if (this.tabs[oldIndex] !== undefined) {
                this.stopGame(oldIndex);
                // save old map's data and call to start new tab
                emitter.emit('get-map-data', {
                    callback: this.startNewTab,
                    tabIndex: oldIndex,
                })
            } else {
                this.startNewTab();
            }


        }
    },
    methods: {
        startNewTab() {
            this.stopGame(this.currentTab);
            emitter.emit('load-map', this.tabs[this.currentTab].mapData);
        },
        setTool(newTool) {
            // toggle visibility of dropdown buttons
            if (newTool === 4) {
                this.showDropdownButtons = true;
            } else {
                this.showDropdownButtons = false;
            }
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
                version: this.versions.length,
                name: `version ${this.versions.length}`,
                mapData: this.tabs[this.currentTab].mapData,
                createdDate: new Date(Date.now()),
                fromVersion: fromVersion === -1 ? null : fromVersion,
            }
            this.versions.push(version);
        },
        newTab(versionNumber) {
            let version = this.versions.find(v => v.version === versionNumber);

            this.tabs.push({
                name: `from: ${version.name}`,
                playing: false,
                mapData: version.mapData,
                fromVersion: version.version,
            });
            this.currentTab = this.tabs.length - 1;
            this.versionView = false;
        }
    },
    computed: {
        rootVersions() {
            // return [];
            return this.versions.filter(version => version.fromVersion === null);
        },
        subVersions() {
            // return [];
            return this.versions.filter(version => version.fromVersion !== null);
        }
    },
    mounted() {
        emitter.on('scene-load', () => {
            this.setTool(this.selectedTool);

            this.makeNewVersion();
            this.tabs[0].name = 'initial v0'
            this.tabs[0].fromVersion = 0;
        });
        emitter.on('map-data', response => {
            this.tabs[response.tabIndex].mapData = response.json;
            response.callback(response.tabIndex);
        });

        // this.newTab(0);
    }
});

vue.component('version-tree', {
    template: '#version-tree',
    emits: ['new-tab'],
    props: [
        'currentVersion',
        'versions',
    ],
    computed: {
        filteredVersion() {
            return this.versions.filter(version => version.fromVersion === this.currentVersion.version);
        }
    }
});


vue.mount('#ui');
