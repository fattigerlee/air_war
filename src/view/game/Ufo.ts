import Util from "../../common/Util";
import GameControl from "./GameControl";
import Config from "../../common/Config";

export default class Ufo extends Laya.Script {
    gameControl: GameControl;
    name: string;
    level: number;

    private parent: Laya.Sprite;
    private width: number;
    private rig: Laya.RigidBody;
    private speed: number;
    private swingLevel: number;
    private duration: number;
    private stop: boolean;

    constructor() {
        super();
    }

    onEnable(): void {
        this.parent = this.owner as Laya.Sprite;
        this.width = this.gameControl.gameScene.width;
        this.swingLevel = 0;
        this.duration = 500;
        this.stop = false;

        let url = "image/" + this.name + ".png";
        if (this.level) {
            url = "image/" + this.name + this.level + ".png";
        }

        this.parent.loadImage(url);

        this.swing();

        this.randomPosition();
    }

    onDisable(): void {
        // 停止缓动
        this.stop = true;

        Laya.Pool.recover(this.name, this.parent);
    }

    onUpdate(): void {
        this.controlSpeed();
    }

    onTriggerEnter(other: any, self: any, contact: any): void {
        if (other.label == "hero") {
            switch (this.name) {
                case "ufo_bomb":
                    // 增加积分
                    this.gameControl.totalScore += Config.ufoBombScore;

                    Laya.SoundManager.playSound("sound/get_bomb.mp3");

                    this.parent.removeSelf();

                    // 炸弹最多积攒三个
                    if (this.gameControl.totalBomb < 3) {
                        this.gameControl.totalBomb++;
                        this.gameControl.gameScene.showBomb();
                    }
                    break;
                case "ufo_bullet":
                    // 增加积分
                    this.gameControl.totalScore += Config.ufoBulletScore * this.level;

                    Laya.SoundManager.playSound("sound/get_bullet.mp3");

                    this.parent.removeSelf();

                    // 随机子弹数量
                    let count = this.gameControl.heroModel.randomBulletCount();

                    // 使用等级最高的子弹
                    if (this.level > this.gameControl.heroModel.bulletLevel) {
                        // 子弹等级不同,使用新数值
                        this.gameControl.heroModel.bulletCount = count;
                        this.gameControl.heroModel.bulletLevel = this.level;
                    } else {
                        // 子弹等级相同,使用数量最多的子弹
                        if (count > this.gameControl.heroModel.bulletCount) {
                            this.gameControl.heroModel.bulletCount = count;
                        }
                    }

                    // 控制子弹时间
                    let delay = (Util.Random(6) + 9) * 1000;
                    this.gameControl.heroModel.bulletEndTime = Date.now() + delay;

                    // 创建buff效果
                    this.gameControl.createBuff("bullet", delay);
                    break;
            }

            this.gameControl.gameScene.showScore();
        }
    }

    // 随机位置
    randomPosition(): void {
        let x = Util.Random(this.width);
        this.parent.pos(x, -100);

        this.speed = 2;
        this.rig = this.parent.getComponent(Laya.RigidBody);
        this.rig.setVelocity({ x: 0, y: this.speed });
    }

    // 摆动,使用代码实现缓动效果,因为碰撞体位置会跟随缓动动画改变
    swing(): void {
        Laya.Tween.clearAll(this.parent);

        if (this.stop) {
            return;
        }

        let rotation = 0;
        switch (this.swingLevel) {
            case 0:
                rotation = 30;
                break;
            case 1:
                rotation = 0;
                break;
            case 2:
                rotation = -30;
                break;
            case 3:
                rotation = 0;
                break;
            default:
                rotation = 30;
                this.swingLevel = 0;
                break;
        }

        this.swingLevel++;
        Laya.Tween.to(this.parent, { rotation: rotation }, this.duration, Laya.Ease.linearNone, Laya.Handler.create(this, this.swing));
    }

    // 控制移动速度
    controlSpeed(): void {
        // 暂停
        if (this.gameControl.pause) {
            this.rig.setVelocity({ x: 0, y: 0.1 });
        } else {
            this.rig.setVelocity({ x: 0, y: this.speed });
        }
    }
}