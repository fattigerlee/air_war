import GameControl from "./GameControl";
import Config from "../../common/Config";
import EventManager from "../../common/EventManager";
import EventType from "../../common/EventType";

export default class Buff extends Laya.Script {
    gameControl: GameControl;
    name: string;                   // buff名称
    cd: number;                     // 总cd时长
    cur: number;                    // 经过的cd时长

    private parent: Laya.Sprite;
    private pie: Laya.Sprite;       // 扇形
    private buff: Laya.Image;       // buff

    constructor() {
        super();
    }

    addEvent(): void {
        EventManager.Ins.addListener(EventType.BuffEnd, this, this.setPosition);
    }

    onEnable(): void {
        this.cur = 0;

        this.parent = this.owner as Laya.Sprite;
        this.pie = this.parent.getChildByName("pie") as Laya.Sprite;
        this.buff = this.parent.getChildByName("buff") as Laya.Image;

        this.gameControl.totalBuff++;

        // 加载buff图片
        let url = "image/buff_" + this.name + ".png";
        this.buff.loadImage(url);

        // 设置buff位置
        this.setPosition();

        this.addEvent();

        Laya.timer.loop(100, this, this.onTimer);
    }

    onDisable(): void {
        switch (this.name) {
            case "bullet":
                EventManager.Ins.dispatch(EventType.BuffBulletEnd);
                break;
            case "god":
                EventManager.Ins.dispatch(EventType.BuffGodEnd);
                break;
        }

        this.gameControl.totalBuff--;
        Laya.timer.clearAll(this);
        EventManager.Ins.dispatch(EventType.BuffEnd);
        Laya.Pool.recover("buff", this.parent);
    }

    onTimer(): void {
        // 时间到了,移除自己
        if (this.cur > this.cd) {
            this.parent.removeSelf();
            return;
        }

        // 画扇形
        let endAngle = 270 - this.cur / this.cd * 360;
        this.pie.graphics.clear();
        this.pie.graphics.drawPie(0, 0, Config.buffRadius + 4, -90, endAngle, "#874d4d");

        // 暂停,经过的cd时长缓慢增加
        if (this.gameControl.pause) {
            this.cur += 1;
        } else {
            this.cur += 100;
        }
    }

    // 设置buff位置
    setPosition(): void {
        let x = Config.buffRadius;
        let y = Config.buffRadius + (this.gameControl.totalBuff - 1) * 80;
        this.parent.pos(x, y);
    }
}