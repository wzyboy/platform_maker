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


const UI = {
    data() {
        return {
            game: game,
            tools: [
                {
                    name: 'edit',
                    icon: 'pen'
                }
            ]
        }
    },
    computed: {
        activeScene() {
            return game.scene.getScenes(true)[0];
        }
    }
}

Vue.createApp(UI).mount('#ui')