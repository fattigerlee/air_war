import Enemy from "./Enemy";
import Config from "../../common/Config";
import HeroModel from "../../model/Hero";
import Util from "../../common/Util";
import Bullet from "./Bullet";
import Hero from "./Hero";
import GameScene from "./GameScene";
import Ufo from "./Ufo";
import Buff from "./Buff";
import EventManager from "../../common/EventManager";
import EventType from "../../common/EventType";

// 游戏管理
export default class GameControl extends Laya.Script {
    /** @prop {name: pHero, tips:"英雄预制体", type:Prefab} */
    pHero: Laya.Prefab;
    /** @prop {name: pBullet, tips:"子弹预制体", type:Prefab} */
    pBullet: Laya.Prefab;
    /** @prop {name: pEnemy1, tips:"敌人1预制体", type:Prefab} */
    pEnemy1: Laya.Prefab;
    /** @prop {name: pEnemy2, tips:"敌人2预制体", type:Prefab} */
    pEnemy2: Laya.Prefab;
    /** @prop {name: pEnemy3, tips:"敌人3预制体", type:Prefab} */
    pEnemy3: Laya.Prefab;
    /** @prop {name: pUfoBomb, tips:"ufo炸弹预制体", type:Prefab} */
    pUfoBomb: Laya.Prefab;
    /** @prop {name: pUfoBullet, tips:"ufo子弹预制体", type:Prefab} */
    pUfoBullet: Laya.Prefab;
    /** @prop {name: pBuff, tips:"buff预制体", type:Prefab} */
    pBuff: Laya.Prefab;

    gameScene: GameScene;           // 游戏场景
    heroModel: HeroModel;           // 英雄数据
    pause: boolean;                 // 暂停
    totalScore: number;             // 总分数
    totalBomb: number;              // 总炸弹数
    totalBuff: number;              // 总buff数量

    private parent: Laya.Sprite;            // 父节点
    private hero: Laya.Sprite;              // 英雄
    private gameBox: Laya.Sprite;           // 游戏盒子
    private createEnemyInterval: number;    // 创建敌人时间间隔
    private startTime: number;              // 开始时间
    private isShot: boolean;                // 是否射击
    private cd: number;                     // 射击冷却值
    private lastShotTime: number;           // 上次射击时间
    private bombStartTime: number;          // ufo炸弹生成时间
    private bulletStartTime: number;        // ufo子弹生成时间
    private touchIdList: number[];          // 触摸点列表
    private lastX: number;                  // 最后触摸点X
    private lastY: number;                  // 最后触摸点Y

    constructor() {
        super();
    }

    addEvent(): void {
        EventManager.Ins.addListener(EventType.BuffBulletEnd, this, this.buffBulletEnd);
        EventManager.Ins.addListener(EventType.BuffGodEnd, this, this.buffGodEnd);
    }

    // 初始化
    init(): void {
        this.parent = this.owner as Laya.Sprite;
        this.gameBox = this.gameScene.gameBox;

        this.heroModel = HeroModel.Ins;
        this.pause = true;
        this.totalScore = 0;
        this.totalBomb = 0;
        this.createEnemyInterval = 1000;
        this.startTime = 0;
        this.isShot = false;
        this.cd = 100;
        this.lastShotTime = 0;
        this.bombStartTime = 0;
        this.bulletStartTime = 0;
        this.touchIdList = new Array();
        this.totalBuff = 0;
    }

    onEnable(): void {
        this.addEvent();
    }

    onDisable(): void {

    }

    onUpdate(): void {
        // 英雄死亡
        if (this.heroModel.death || this.pause) {
            return;
        }

        let now = Date.now();
        if (this.isShot && now - this.lastShotTime >= this.cd) {
            this.lastShotTime = now;
            this.createBullet();
        }

        // 生成敌人
        if (now - this.startTime >= this.createEnemyInterval) {
            this.startTime = now;

            this.createEnemy();
        }

        // 创建ufo炸弹
        if (now - this.bombStartTime >= 3000) {
            this.bombStartTime = now;

            this.createUfoBomb();
        }

        // 创建ufo炸弹
        if (now - this.bulletStartTime >= 5000) {
            this.bulletStartTime = now;

            this.createUfoBullet();
        }
    }

    onMouseDown(e: Laya.Event): void {
        // 英雄死亡
        if (this.heroModel.death) {
            return;
        }

        let touches = e.touches;
        if (!touches) {
            return;
        }

        // 添加触摸点id
        this.touchIdList.push(e.touchId);

        // 鼠标单次按下,监听鼠标移动事件
        if (touches.length == 1) {
            let touch = e.touches[0];
            this.lastX = touch.stageX;
            this.lastY = touch.stageY;

            this.parent.on(Laya.Event.MOUSE_MOVE, this, this.onHeroMove);

            this.pause = false;
            this.isShot = true;
            this.lastShotTime = Date.now();
            return;
        }

        // 鼠标多次按下,不重复监听移动事件
    }

    onMouseUp(e: Laya.Event): void {
        let touches = e.touches;
        if (!touches) {
            return;
        }

        // 删除抬起触摸点
        for (let i = 0; i < this.touchIdList.length; i++) {
            if (e.touchId == this.touchIdList[i]) {
                this.touchIdList.splice(i, 1);
                break;
            }
        }

        if (touches.length == 0) {
            // 无触摸点,关闭移动事件
            this.parent.off(Laya.Event.MOUSE_MOVE, this, this.onHeroMove);

            this.pause = true;
            this.isShot = false;
            return;
        }

        // 英雄移动到当前触摸点所在位置,更新鼠标相对触摸点的位置
        for (let i = 0; i < e.touches.length; i++) {
            let touch = e.touches[i];
            if (touch.identifier == this.touchIdList[0]) {
                this.lastX = touch.stageX;
                this.lastY = touch.stageY;
                Laya.Tween.to(this.hero, { x: this.lastX, y: this.lastY }, 100);
            }
        }
    }

    // 英雄移动
    onHeroMove(e: Laya.Event): void {
        let touches = e.touches;
        if (!touches) {
            return;
        }

        // 根据最后触摸点id移动
        let touchId = this.touchIdList[0];
        if (e.touchId !== touchId) {
            return;
        }

        // 选择触摸点作为相对位置移动
        for (let i = 0; i < e.touches.length; i++) {
            let touch = e.touches[i];
            if (touch.identifier == touchId) {
                this.hero.x += touch.stageX - this.lastX;
                if (this.hero.x < 0) {
                    this.hero.x = 0;
                }
                if (this.hero.x > this.gameScene.width) {
                    this.hero.x = this.gameScene.width;
                }

                this.hero.y += touch.stageY - this.lastY;
                if (this.hero.y < 0) {
                    this.hero.y = 0;
                }

                // 全面屏边界值检测
                let height = this.gameScene.height;
                if (Laya.Browser.clientHeight / Laya.Browser.clientWidth > 2) {
                    height = this.gameScene.height - 20;
                }

                if (this.hero.y > height) {
                    this.hero.y = height;
                }
                this.lastX = touch.stageX;
                this.lastY = touch.stageY;
                break;
            }
        }
    }

    // 创建英雄
    createHero(): void {
        this.heroModel.death = false;

        this.hero = Laya.Pool.getItemByCreateFun("hero", this.pHero.create, this.pHero);
        let comp = this.hero.getComponent(Hero);
        comp.gameControl = this;

        // 未死亡过,从出生点复活
        if (this.heroModel.deathCount == 0) {
            this.hero.pos(this.parent.width / 2, this.parent.height - 200);
            this.gameBox.addChild(this.hero);
            return;
        }

        // 死亡过,进入无敌模式
        this.heroModel.god = true;
        this.heroModel.bulletLevel = 1;
        this.heroModel.bulletEndTime = 0;

        // 随机子弹数量
        let count = this.heroModel.randomBulletCount();
        if (count > this.heroModel.bulletCountDefault) {
            this.heroModel.bulletCountDefault = count;
        }
        this.heroModel.bulletCount = this.heroModel.bulletCountDefault;

        // 死亡点复活
        this.hero.pos(this.heroModel.deathPosX, this.heroModel.deathPosY);
        this.gameBox.addChild(this.hero);
    }

    // 创建子弹
    createBullet(): void {
        for (let i = 0; i < this.heroModel.bulletCount; i++) {
            let bullet: Laya.Sprite = Laya.Pool.getItemByCreateFun("bullet", this.pBullet.create, this.pBullet);

            let comp = bullet.getComponent(Bullet);
            comp.level = this.heroModel.bulletLevel;

            // 偶数,设置向左倾斜发射子弹;奇数,设置向右倾斜发射子弹
            if (i % 2 == 0) {
                comp.x = -i * 2;
            } else {
                comp.x = (i + 1) * 2;
            }

            this.gameBox.addChild(bullet);

            // 让子弹从飞机中心点位置射出
            let x = this.hero.x - Config.bulletWidth / 2;
            let y = this.hero.y - Config.heroHeight / 2 - Config.bulletHeight;
            bullet.pos(x, y);
        }

        // 子弹音效
        Laya.SoundManager.playSound("sound/bullet.mp3");
    }

    // 创建敌人
    createEnemy(): void {
        // 随机等级
        let level = Util.Random(3);
        let hp = Util.Random(level * 5);;
        let name = "enemy" + level;
        let enemy: Laya.Sprite;

        switch (level) {
            case 1:
                enemy = Laya.Pool.getItemByCreateFun(name, this.pEnemy1.create, this.pEnemy1);
                break;
            case 2:
                enemy = Laya.Pool.getItemByCreateFun(name, this.pEnemy2.create, this.pEnemy2);
                hp += 3;
                break;
            case 3:
                enemy = Laya.Pool.getItemByCreateFun(name, this.pEnemy3.create, this.pEnemy3);
                hp += 5;
                break;
        }

        let comp = enemy.getComponent(Enemy);
        comp.gameControl = this;
        comp.level = level;
        comp.hp = hp;
        comp.hp = comp.level * 5;
        this.gameBox.addChild(enemy);
    }

    // 创建ufo炸弹
    createUfoBomb(): void {
        let name = "ufo_bomb";
        let bomb = Laya.Pool.getItemByCreateFun(name, this.pUfoBomb.create, this.pUfoBomb);

        let comp = bomb.getComponent(Ufo);
        comp.gameControl = this;
        comp.name = name;
        this.gameBox.addChild(bomb);
    }

    // 创建ufo子弹
    createUfoBullet(): void {
        let name = "ufo_bullet";
        let bullet = Laya.Pool.getItemByCreateFun(name, this.pUfoBullet.create, this.pUfoBullet);

        let comp = bullet.getComponent(Ufo);
        comp.gameControl = this;
        comp.name = name;
        comp.level = Util.Random(2);
        this.gameBox.addChild(bullet);
    }

    // 创建buff
    createBuff(name: string, cd: number): void {
        let buff = this.gameScene.buff.getChildByName(name);
        if (buff) {
            // buff已存在,刷新cd
            let comp = buff.getComponent(Buff);
            comp.cd = cd;
            comp.cur = 0;
            return;
        }

        // buff不存在,创建buff
        buff = Laya.Pool.getItemByCreateFun("buff", this.pBuff.create, this.pBuff);
        buff.name = name;

        let comp = buff.getComponent(Buff);
        comp.gameControl = this;
        comp.name = name;
        comp.cd = cd;
        this.gameScene.buff.addChild(buff);
    }

    // 清空buff
    cleanBuff(): void {
        this.gameScene.buff.removeChildren(0, this.gameScene.buff.numChildren);
    }

    // 清空游戏盒子
    cleanGameBox(): void {
        this.gameBox.alpha = 1;
        this.gameBox.removeChildren(0, this.gameBox.numChildren);
    }

    // 清空所有敌人
    cleanEnemy(): void {
        let count = this.gameBox.numChildren;
        for (let i = 0; i < count; i++) {
            let child = this.gameBox.getChildAt(i);
            if (child.name == "enemy") {
                let comp = child.getComponent(Enemy);
                comp.down();
            }
        }
    }

    // 使用炸弹
    onUseBomb(): void {
        if (this.totalBomb == 0) {
            return;
        }

        Laya.SoundManager.playSound("sound/use_bomb.mp3");

        this.totalBomb--;
        this.gameScene.showBomb();

        this.cleanEnemy();
    }

    // 弹药buff结束
    buffBulletEnd(): void {
        // 恢复初始子弹等级
        this.heroModel.bulletLevel = 1;
        this.heroModel.bulletCount = this.heroModel.bulletCountDefault;
    }

    // 无敌效果结束
    buffGodEnd(): void {
        this.heroModel.god = false;
    }
}