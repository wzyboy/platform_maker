const emitter = mitt();
const config = {
    type: Phaser.AUTO,
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
            debug: false
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
            ]
        }
    },
    watch: {
        selectedTool(newTool) {
            this.setTool(newTool);
        }
    },
    methods: {
        setTool(newTool) {
            if (this.scene) {
                this.scene.selectedTool = newTool;
            }
        }
    },
    mounted() {
        this.selectedTool = 0;
        emitter.on('scene-load', scene => {
            this.scene = scene;
            this.setTool(this.selectedTool);
        });
    }
}

Vue.createApp(UI).mount('#ui')