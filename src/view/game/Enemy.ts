import Util from "../../common/Util";
import Config from "../../common/Config";
import GameControl from "./GameControl";

// 敌人
export default class Enemy extends Laya.Script {
    gameControl: GameControl;       // 游戏管理
    level: number;                  // 等级
    hp: number;                     // 血量
    score: number;                  // 分数
    death: boolean;                 // 死亡

    private parent: Laya.Sprite;
    private name: string;
    private flySound: Laya.SoundChannel;    // 飞行音效
    private ani: Laya.Animation;            // 动画
    private rig: Laya.RigidBody;            // 刚体
    private speed: number;                  // 移动速度

    constructor() {
        super();
    }

    onEnable(): void {
        this.score = this.hp * 100;
        this.death = false;
        this.parent = this.owner as Laya.Sprite;
        this.name = "enemy" + this.level;

        this.randomSpeed();

        this.randomPosition();

        this.loadAni();

        this.fly();
    }

    onDisable(): void {
        // 关闭飞行音效
        if (!this.death) {
            this.stopFlySound();
        }

        // 回收资源
        Laya.Pool.recover(this.name, this.parent);
    }

    onUpdate(): void {
        this.controlSpeed();

        // 超出屏幕,移除自己
        if (this.parent.y >= this.gameControl.gameScene.height) {
            this.parent.removeSelf();
        }
    }

    // 碰撞
    onTriggerEnter(other: any, self: any, contact: any): void {
        // 死亡
        if (this.death) {
            return;
        }

        switch (other.label) {
            case "bullet":
                this.hit();
                break;
        }
    }

    // 随机移动速度
    randomSpeed(): void {
        this.rig = this.parent.getComponent(Laya.RigidBody);

        switch (this.level) {
            case 1:
                this.speed = Util.Random(7) + 5;
                break;
            case 2:
                this.speed = Util.Random(5) + 3;
                break;
            case 3:
                this.speed = Util.Random(3) + 1;
                break;
        }
    }

    // 控制移动速度
    controlSpeed(): void {
        // 暂停,自己死亡,英雄死亡,敌人缓动
        if (this.gameControl.pause || this.death || this.gameControl.heroModel.death) {
            this.rig.setVelocity({ x: 0, y: 0.1 });
        } else {
            this.rig.setVelocity({ x: 0, y: this.speed });
        }
    }

    // 随机生成位置
    randomPosition(): void {
        let x: number = 0;
        let y: number = 0;

        switch (this.level) {
            case 1:
                x = Util.Random(this.gameControl.gameScene.width - Config.enemy1Width);
                y = -Config.enemy1Height;
                break;
            case 2:
                x = Util.Random(this.gameControl.gameScene.width - Config.enemy2Width);
                y = -Config.enemy2Height;
                break;
            case 3:
                x = Util.Random(this.gameControl.gameScene.width - Config.enemy3Width);
                y = -Config.enemy3Height;
                break;
        }

        this.parent.pos(x, y);
    }

    // 加载动画
    loadAni(): void {
        if (this.ani) {
            return;
        }

        let url = "animation/" + this.name + ".ani";
        this.ani = new Laya.Animation();
        this.parent.addChild(this.ani);

        this.ani.loadAnimation(url);
    }

    // 关闭飞行音效
    stopFlySound(): void {
        if (!this.flySound) {
            return;
        }

        if (this.level == 3) {
            this.flySound.stop();
        }
    }

    // 飞行
    fly(): void {
        this.ani.play(0, true, "fly");

        if (this.level == 3) {
            this.flySound = Laya.SoundManager.playSound("sound/enemy3_fly.mp3", 0);
        }
    }

    // 被攻击
    hit(): void {
        if (this.level !== 1) {
            this.ani.play(0, false, "hit");

            // 一定时间后,继续播放飞行动画
            Laya.timer.once(120, this, function () {
                if (this.death) {
                    return;
                }

                this.ani.play(0, true, "fly");
            });
        }

        this.hp -= this.gameControl.heroModel.getAtk();
        if (this.hp <= 0) {
            this.down();
        }
    }

    // 坠机
    down(): void {
        this.death = true;
        this.gameControl.totalScore += this.score;
        this.gameControl.gameScene.showScore();

        this.controlSpeed();

        this.stopFlySound();

        let url = "sound/enemy" + this.level + "_down.mp3";
        Laya.SoundManager.playSound(url);

        this.ani.play(0, false, "down");

        // 播放完动画,移除自己
        switch (this.level) {
            case 3:
                Laya.timer.once(420, this, function () {
                    this.parent.removeSelf();
                });
                break;
            default:
                Laya.timer.once(300, this, function () {
                    this.parent.removeSelf();
                });
                break;
        }
    }
}