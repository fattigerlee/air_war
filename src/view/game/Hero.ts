import Config from "../../common/Config";
import GameControl from "./GameControl";

// 英雄
export default class Hero extends Laya.Script {
    gameControl: GameControl;

    private parent: Laya.Sprite;
    private ani: Laya.Animation;
    private alphaLevel: number;
    private duration: number;

    constructor() {
        super();
    }

    onEnable(): void {
        this.parent = this.owner as Laya.Sprite;
        this.alphaLevel = 0;
        this.duration = 250;

        this.loadAni();

        this.fly();

        if (this.gameControl && this.gameControl.heroModel.god) {
            this.god();
        }
    }

    onDisable(): void {
        if (!this.gameControl) {
            return;
        }

        Laya.Pool.recover("hero", this.parent);
    }

    onTriggerEnter(other: any, self: any, contact: any): void {
        if (this.gameControl.heroModel.death) {
            return;
        }

        switch (other.label) {
            case "enemy":
                this.down();
                break;
        }
    }

    // 加载动画
    loadAni(): void {
        if (this.ani) {
            return;
        }

        let url = "animation/hero.ani";
        this.ani = new Laya.Animation();
        this.parent.addChild(this.ani);

        this.ani.loadAnimation(url);
        this.ani.pivot(Config.heroWidth / 2, Config.heroHeight / 2);
    }

    // 飞行
    fly(): void {
        this.ani.play(0, true, "fly");
    }

    // 无敌
    god(): void {
        this.godAni();

        let delay = 6000;

        // 创建buff效果
        this.gameControl.createBuff("god", delay);
    }

    // 无敌动画
    godAni(): void {
        Laya.Tween.clearAll(this.parent);

        if (!this.gameControl.heroModel.god) {
            this.parent.alpha = 1;
            return;
        }

        let alpha = 0;
        switch (this.alphaLevel) {
            case 0:
                alpha = 1;
                break;
            case 1:
                alpha = 0.2;
                break;
            default:
                alpha = 1;
                this.alphaLevel = 0;
                break;
        }

        this.alphaLevel++;
        Laya.Tween.to(this.parent, { alpha: alpha }, this.duration, Laya.Ease.linearNone, Laya.Handler.create(this, this.godAni));
    }

    // 坠机
    down(): void {
        // 当前处于无敌状态
        if (this.gameControl.heroModel.god) {
            return;
        }

        // 清除buff
        this.gameControl.cleanBuff();

        this.gameControl.heroModel.death = true;
        this.gameControl.heroModel.deathCount++;
        this.gameControl.heroModel.deathPosX = this.parent.x;
        this.gameControl.heroModel.deathPosY = this.parent.y;

        let url = "sound/hero_down.mp3";
        Laya.SoundManager.playSound(url);

        this.ani.play(0, false, "down");

        // 播放完动画,移除自己
        Laya.timer.once(300, this, function () {
            this.parent.removeSelf();

            // 界面半透明
            this.gameControl.gameScene.gameBox.alpha = 0.5;

            // 弹出结果信息
            this.gameControl.gameScene.result.visible = true;
            this.gameControl.gameScene.resultScore.visible = true;

            this.gameControl.gameScene.showCurScore();
            this.gameControl.gameScene.showMaxScore();

            // 如果达到复活上限,无法选择复活
            if (this.gameControl.heroModel.deathCount > 1) {
                this.gameControl.gameScene.hideBtnContinue();
            }
        });
    }
}