import Util from "../common/Util";

// 英雄信息
export default class HeroModel {
    god: boolean;               // 是否无敌
    death: boolean;             // 死亡
    deathCount: number;         // 死亡次数
    deathPosX: number;          // 死亡位置X
    deathPosY: number;          // 死亡位置Y
    bulletLevel: number;        // 子弹等级
    bulletCountDefault: number; // 子弹默认数量
    bulletCount: number;        // 子弹数量
    bulletEndTime: number;      // 子弹结束时间

    constructor() {

    }

    init(): void {
        this.god = false;
        this.death = true;
        this.deathCount = 0;
        this.bulletLevel = 1;
        this.bulletCountDefault = 1;
        this.bulletCount = 1;
    }

    // 获取攻击力
    getAtk(): number {
        return this.bulletLevel;
    }

    // 随机子弹数量
    randomBulletCount(): number {
        let count = Util.Random(9) + 2;
        if (count % 2 == 0) {
            count--;
        }
        return count;
    }

    private static instance: HeroModel;
    public static get Ins(): HeroModel {
        if (!HeroModel.instance) {
            HeroModel.instance = new HeroModel();
        }
        return HeroModel.instance;
    }
}