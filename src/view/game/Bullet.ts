import Config from "../../common/Config";

// 子弹
export default class Bullet extends Laya.Script {
    level: number;
    x: number;              // x轴速度,方便子弹倾斜

    private parent: Laya.Sprite;
    private rig: Laya.RigidBody;
    private distance: number;       // 一定距离之后,子弹不再倾斜

    constructor() {
        super();
    }

    onEnable(): void {
        this.parent = this.owner as Laya.Sprite;
        this.distance = 50;
        let url = "image/bullet" + this.level + ".png";
        this.parent.graphics.loadImage(url, 0, 0, Config.bulletWidth, Config.bulletHeight);

        this.rig = this.parent.getComponent(Laya.RigidBody);
        this.rig.setVelocity({ x: this.x, y: -10 });
    }

    onDisable(): void {
        Laya.Pool.recover("bullet", this.parent);
    }

    onUpdate(): void {
        // 子弹离开屏幕,移除
        if (this.parent.y <= 0) {
            this.parent.removeSelf();
            return;
        }

        if (this.distance > 0) {
            this.distance -= 10;
            if (this.distance == 0) {
                this.rig.setVelocity({ x: 0, y: -10 });
            }
        }
    }

    onTriggerEnter(other: any, self: any, contact: any): void {
        this.parent.removeSelf();
    }
}