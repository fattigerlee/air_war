import GameControl from "./GameControl";

// 背景
export default class Background extends Laya.Script {
    gameControl: GameControl;
    width: number;
    height: number;

    private parent: Laya.Sprite;
    private speed: number;

    constructor() {
        super();
    }

    onEnable(): void {
        this.parent = this.owner as Laya.Sprite;
        this.speed = 5;

        for (let i = 0; i < 2; i++) {
            this.createBg(i);
        }
    }

    onDisable(): void {

    }

    onUpdate(): void {
        this.run();
    }

    // 创建背景图
    createBg(index: number) {
        let bg = new Laya.Image();
        bg.loadImage("image/background.png");

        bg.width = this.width;
        bg.height = this.height;
        bg.pos(0, -this.height * index);
        this.parent.addChild(bg);
    }

    run(): void {
        if (this.parent.numChildren != 2) {
            return
        }

        if (this.gameControl && this.gameControl.pause) {
            this.speed = 0.1;
        } else {
            this.speed = 5;
        }

        this.parent.y += this.speed;
        let move = Math.abs(this.parent.y);

        // 第一张图显示完,父节点移动到第二张图相对场景所在位置
        if (move >= this.height) {
            this.parent.y -= this.height;
        }
    }
}