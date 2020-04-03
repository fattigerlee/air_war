(function () {
	'use strict';

	var REG = Laya.ClassUtils.regClass;
	var ui;
	(function (ui) {
	    var scene;
	    (function (scene) {
	        class gameSceneUI extends Laya.Scene {
	            constructor() { super(); }
	            createChildren() {
	                super.createChildren();
	                this.loadScene("scene/gameScene");
	            }
	        }
	        scene.gameSceneUI = gameSceneUI;
	        REG("ui.scene.gameSceneUI", gameSceneUI);
	        class loginSceneUI extends Laya.Scene {
	            constructor() { super(); }
	            createChildren() {
	                super.createChildren();
	                this.loadScene("scene/loginScene");
	            }
	        }
	        scene.loginSceneUI = loginSceneUI;
	        REG("ui.scene.loginSceneUI", loginSceneUI);
	    })(scene = ui.scene || (ui.scene = {}));
	})(ui || (ui = {}));

	class Util {
	    static ClickButton(button, caller, listener) {
	        button.on(Laya.Event.CLICK, caller, function () {
	            Laya.SoundManager.playSound("sound/button.mp3");
	            listener.bind(caller)();
	        });
	    }
	    static Random(num) {
	        let today = new Date();
	        let seed = today.getTime();
	        return Math.ceil(this.rnd(seed) * num);
	    }
	    static rnd(seed) {
	        seed = (seed * 9301 + 49297) % 233280;
	        return seed / (233280.0);
	    }
	    static resize() {
	        Laya.Scene.unDestroyedScenes.forEach((scene) => {
	            Util.adjustScene(scene);
	            Util.adjustUI(scene.scaleGroup);
	        });
	    }
	    static adjustScene(caller) {
	        if (!caller) {
	            return;
	        }
	        let scale = Laya.Browser.width / Laya.Browser.height;
	        switch (Laya.stage.scaleMode) {
	            case "fixedwidth":
	                caller.height = caller.width / scale;
	                break;
	            case "fixedheight":
	                caller.width = caller.height * scale;
	                break;
	        }
	    }
	    static adjustUI(b) {
	        if (!b) {
	            return;
	        }
	        if (Laya.Browser.height / Laya.Browser.width > 2) {
	            console.log("全面屏...");
	            b.top = 25;
	            b.bottom = 50;
	        }
	    }
	}

	class Config {
	}
	Config.heroWidth = 99;
	Config.heroHeight = 124;
	Config.bulletWidth = 9;
	Config.bulletHeight = 21;
	Config.enemy1Width = 57;
	Config.enemy1Height = 51;
	Config.enemy2Width = 69;
	Config.enemy2Height = 95;
	Config.enemy3Width = 169;
	Config.enemy3Height = 258;
	Config.ufoBombScore = 10000;
	Config.ufoBulletScore = 5000;
	Config.buffRadius = 32;

	class Enemy extends Laya.Script {
	    constructor() {
	        super();
	    }
	    onEnable() {
	        this.score = this.hp * 100;
	        this.death = false;
	        this.parent = this.owner;
	        this.name = "enemy" + this.level;
	        this.randomSpeed();
	        this.randomPosition();
	        this.loadAni();
	        this.fly();
	    }
	    onDisable() {
	        if (!this.death) {
	            this.stopFlySound();
	        }
	        Laya.Pool.recover(this.name, this.parent);
	    }
	    onUpdate() {
	        this.controlSpeed();
	        if (this.parent.y >= this.gameControl.gameScene.height) {
	            this.parent.removeSelf();
	        }
	    }
	    onTriggerEnter(other, self, contact) {
	        if (this.death) {
	            return;
	        }
	        switch (other.label) {
	            case "bullet":
	                this.hit();
	                break;
	        }
	    }
	    randomSpeed() {
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
	    controlSpeed() {
	        if (this.gameControl.pause || this.death || this.gameControl.heroModel.death) {
	            this.rig.setVelocity({ x: 0, y: 0.1 });
	        }
	        else {
	            this.rig.setVelocity({ x: 0, y: this.speed });
	        }
	    }
	    randomPosition() {
	        let x = 0;
	        let y = 0;
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
	    loadAni() {
	        if (this.ani) {
	            return;
	        }
	        let url = "animation/" + this.name + ".ani";
	        this.ani = new Laya.Animation();
	        this.parent.addChild(this.ani);
	        this.ani.loadAnimation(url);
	    }
	    stopFlySound() {
	        if (!this.flySound) {
	            return;
	        }
	        if (this.level == 3) {
	            this.flySound.stop();
	        }
	    }
	    fly() {
	        this.ani.play(0, true, "fly");
	        if (this.level == 3) {
	            this.flySound = Laya.SoundManager.playSound("sound/enemy3_fly.mp3", 0);
	        }
	    }
	    hit() {
	        if (this.level !== 1) {
	            this.ani.play(0, false, "hit");
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
	    down() {
	        this.death = true;
	        this.gameControl.totalScore += this.score;
	        this.gameControl.gameScene.showScore();
	        this.controlSpeed();
	        this.stopFlySound();
	        let url = "sound/enemy" + this.level + "_down.mp3";
	        Laya.SoundManager.playSound(url);
	        this.ani.play(0, false, "down");
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

	class HeroModel {
	    constructor() {
	    }
	    init() {
	        this.god = false;
	        this.death = true;
	        this.deathCount = 0;
	        this.bulletLevel = 1;
	        this.bulletCountDefault = 1;
	        this.bulletCount = 1;
	    }
	    getAtk() {
	        return this.bulletLevel;
	    }
	    randomBulletCount() {
	        let count = Util.Random(9) + 2;
	        if (count % 2 == 0) {
	            count--;
	        }
	        return count;
	    }
	    static get Ins() {
	        if (!HeroModel.instance) {
	            HeroModel.instance = new HeroModel();
	        }
	        return HeroModel.instance;
	    }
	}

	class Bullet extends Laya.Script {
	    constructor() {
	        super();
	    }
	    onEnable() {
	        this.parent = this.owner;
	        this.distance = 50;
	        let url = "image/bullet" + this.level + ".png";
	        this.parent.graphics.loadImage(url, 0, 0, Config.bulletWidth, Config.bulletHeight);
	        this.rig = this.parent.getComponent(Laya.RigidBody);
	        this.rig.setVelocity({ x: this.x, y: -10 });
	    }
	    onDisable() {
	        Laya.Pool.recover("bullet", this.parent);
	    }
	    onUpdate() {
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
	    onTriggerEnter(other, self, contact) {
	        this.parent.removeSelf();
	    }
	}

	class Hero extends Laya.Script {
	    constructor() {
	        super();
	    }
	    onEnable() {
	        this.parent = this.owner;
	        this.alphaLevel = 0;
	        this.duration = 250;
	        this.loadAni();
	        this.fly();
	        if (this.gameControl && this.gameControl.heroModel.god) {
	            this.god();
	        }
	    }
	    onDisable() {
	        if (!this.gameControl) {
	            return;
	        }
	        Laya.Pool.recover("hero", this.parent);
	    }
	    onTriggerEnter(other, self, contact) {
	        if (this.gameControl.heroModel.death) {
	            return;
	        }
	        switch (other.label) {
	            case "enemy":
	                this.down();
	                break;
	        }
	    }
	    loadAni() {
	        if (this.ani) {
	            return;
	        }
	        let url = "animation/hero.ani";
	        this.ani = new Laya.Animation();
	        this.parent.addChild(this.ani);
	        this.ani.loadAnimation(url);
	        this.ani.pivot(Config.heroWidth / 2, Config.heroHeight / 2);
	    }
	    fly() {
	        this.ani.play(0, true, "fly");
	    }
	    god() {
	        this.godAni();
	        let delay = 6000;
	        this.gameControl.createBuff("god", delay);
	    }
	    godAni() {
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
	    down() {
	        if (this.gameControl.heroModel.god) {
	            return;
	        }
	        this.gameControl.cleanBuff();
	        this.gameControl.heroModel.death = true;
	        this.gameControl.heroModel.deathCount++;
	        this.gameControl.heroModel.deathPosX = this.parent.x;
	        this.gameControl.heroModel.deathPosY = this.parent.y;
	        let url = "sound/hero_down.mp3";
	        Laya.SoundManager.playSound(url);
	        this.ani.play(0, false, "down");
	        Laya.timer.once(300, this, function () {
	            this.parent.removeSelf();
	            this.gameControl.gameScene.gameBox.alpha = 0.5;
	            this.gameControl.gameScene.result.visible = true;
	            this.gameControl.gameScene.resultScore.visible = true;
	            this.gameControl.gameScene.showCurScore();
	            this.gameControl.gameScene.showMaxScore();
	            if (this.gameControl.heroModel.deathCount > 1) {
	                this.gameControl.gameScene.hideBtnContinue();
	            }
	        });
	    }
	}

	class Ufo extends Laya.Script {
	    constructor() {
	        super();
	    }
	    onEnable() {
	        this.parent = this.owner;
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
	    onDisable() {
	        this.stop = true;
	        Laya.Pool.recover(this.name, this.parent);
	    }
	    onUpdate() {
	        this.controlSpeed();
	    }
	    onTriggerEnter(other, self, contact) {
	        if (other.label == "hero") {
	            switch (this.name) {
	                case "ufo_bomb":
	                    this.gameControl.totalScore += Config.ufoBombScore;
	                    Laya.SoundManager.playSound("sound/get_bomb.mp3");
	                    this.parent.removeSelf();
	                    if (this.gameControl.totalBomb < 3) {
	                        this.gameControl.totalBomb++;
	                        this.gameControl.gameScene.showBomb();
	                    }
	                    break;
	                case "ufo_bullet":
	                    this.gameControl.totalScore += Config.ufoBulletScore * this.level;
	                    Laya.SoundManager.playSound("sound/get_bullet.mp3");
	                    this.parent.removeSelf();
	                    let count = this.gameControl.heroModel.randomBulletCount();
	                    if (this.level > this.gameControl.heroModel.bulletLevel) {
	                        this.gameControl.heroModel.bulletCount = count;
	                        this.gameControl.heroModel.bulletLevel = this.level;
	                    }
	                    else {
	                        if (count > this.gameControl.heroModel.bulletCount) {
	                            this.gameControl.heroModel.bulletCount = count;
	                        }
	                    }
	                    let delay = (Util.Random(6) + 9) * 1000;
	                    this.gameControl.heroModel.bulletEndTime = Date.now() + delay;
	                    this.gameControl.createBuff("bullet", delay);
	                    break;
	            }
	            this.gameControl.gameScene.showScore();
	        }
	    }
	    randomPosition() {
	        let x = Util.Random(this.width);
	        this.parent.pos(x, -100);
	        this.speed = 2;
	        this.rig = this.parent.getComponent(Laya.RigidBody);
	        this.rig.setVelocity({ x: 0, y: this.speed });
	    }
	    swing() {
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
	    controlSpeed() {
	        if (this.gameControl.pause) {
	            this.rig.setVelocity({ x: 0, y: 0.1 });
	        }
	        else {
	            this.rig.setVelocity({ x: 0, y: this.speed });
	        }
	    }
	}

	class EventManager {
	    constructor() {
	        this.eventDispatcher = new Laya.EventDispatcher();
	    }
	    addListener(type, caller, listener, args) {
	        this.eventDispatcher.on(type, caller, listener, args);
	    }
	    dispatch(type, data) {
	        this.eventDispatcher.event(type, data);
	    }
	    static get Ins() {
	        if (!EventManager.instance) {
	            EventManager.instance = new EventManager();
	        }
	        return EventManager.instance;
	    }
	}

	class EventType {
	}
	EventType.HeroDeath = "hero_death";
	EventType.BuffEnd = "buff_end";
	EventType.BuffBulletEnd = "buff_bullet_end";
	EventType.BuffGodEnd = "buff_god_end";

	class Buff extends Laya.Script {
	    constructor() {
	        super();
	    }
	    addEvent() {
	        EventManager.Ins.addListener(EventType.BuffEnd, this, this.setPosition);
	    }
	    onEnable() {
	        this.cur = 0;
	        this.parent = this.owner;
	        this.pie = this.parent.getChildByName("pie");
	        this.buff = this.parent.getChildByName("buff");
	        this.gameControl.totalBuff++;
	        let url = "image/buff_" + this.name + ".png";
	        this.buff.loadImage(url);
	        this.setPosition();
	        this.addEvent();
	        Laya.timer.loop(100, this, this.onTimer);
	    }
	    onDisable() {
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
	    onTimer() {
	        if (this.cur > this.cd) {
	            this.parent.removeSelf();
	            return;
	        }
	        let endAngle = 270 - this.cur / this.cd * 360;
	        this.pie.graphics.clear();
	        this.pie.graphics.drawPie(0, 0, Config.buffRadius + 4, -90, endAngle, "#874d4d");
	        if (this.gameControl.pause) {
	            this.cur += 1;
	        }
	        else {
	            this.cur += 100;
	        }
	    }
	    setPosition() {
	        let x = Config.buffRadius;
	        let y = Config.buffRadius + (this.gameControl.totalBuff - 1) * 80;
	        this.parent.pos(x, y);
	    }
	}

	class GameControl extends Laya.Script {
	    constructor() {
	        super();
	    }
	    addEvent() {
	        EventManager.Ins.addListener(EventType.BuffBulletEnd, this, this.buffBulletEnd);
	        EventManager.Ins.addListener(EventType.BuffGodEnd, this, this.buffGodEnd);
	    }
	    init() {
	        this.parent = this.owner;
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
	    onEnable() {
	        this.addEvent();
	    }
	    onDisable() {
	    }
	    onUpdate() {
	        if (this.heroModel.death || this.pause) {
	            return;
	        }
	        let now = Date.now();
	        if (this.isShot && now - this.lastShotTime >= this.cd) {
	            this.lastShotTime = now;
	            this.createBullet();
	        }
	        if (now - this.startTime >= this.createEnemyInterval) {
	            this.startTime = now;
	            this.createEnemy();
	        }
	        if (now - this.bombStartTime >= 3000) {
	            this.bombStartTime = now;
	            this.createUfoBomb();
	        }
	        if (now - this.bulletStartTime >= 5000) {
	            this.bulletStartTime = now;
	            this.createUfoBullet();
	        }
	    }
	    onMouseDown(e) {
	        if (this.heroModel.death) {
	            return;
	        }
	        let touches = e.touches;
	        if (!touches) {
	            return;
	        }
	        this.touchIdList.push(e.touchId);
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
	    }
	    onMouseUp(e) {
	        let touches = e.touches;
	        if (!touches) {
	            return;
	        }
	        for (let i = 0; i < this.touchIdList.length; i++) {
	            if (e.touchId == this.touchIdList[i]) {
	                this.touchIdList.splice(i, 1);
	                break;
	            }
	        }
	        if (touches.length == 0) {
	            this.parent.off(Laya.Event.MOUSE_MOVE, this, this.onHeroMove);
	            this.pause = true;
	            this.isShot = false;
	            return;
	        }
	        for (let i = 0; i < e.touches.length; i++) {
	            let touch = e.touches[i];
	            if (touch.identifier == this.touchIdList[0]) {
	                this.lastX = touch.stageX;
	                this.lastY = touch.stageY;
	                Laya.Tween.to(this.hero, { x: this.lastX, y: this.lastY }, 100);
	            }
	        }
	    }
	    onHeroMove(e) {
	        let touches = e.touches;
	        if (!touches) {
	            return;
	        }
	        let touchId = this.touchIdList[0];
	        if (e.touchId !== touchId) {
	            return;
	        }
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
	    createHero() {
	        this.heroModel.death = false;
	        this.hero = Laya.Pool.getItemByCreateFun("hero", this.pHero.create, this.pHero);
	        let comp = this.hero.getComponent(Hero);
	        comp.gameControl = this;
	        if (this.heroModel.deathCount == 0) {
	            this.hero.pos(this.parent.width / 2, this.parent.height - 200);
	            this.gameBox.addChild(this.hero);
	            return;
	        }
	        this.heroModel.god = true;
	        this.heroModel.bulletLevel = 1;
	        this.heroModel.bulletEndTime = 0;
	        let count = this.heroModel.randomBulletCount();
	        if (count > this.heroModel.bulletCountDefault) {
	            this.heroModel.bulletCountDefault = count;
	        }
	        this.heroModel.bulletCount = this.heroModel.bulletCountDefault;
	        this.hero.pos(this.heroModel.deathPosX, this.heroModel.deathPosY);
	        this.gameBox.addChild(this.hero);
	    }
	    createBullet() {
	        for (let i = 0; i < this.heroModel.bulletCount; i++) {
	            let bullet = Laya.Pool.getItemByCreateFun("bullet", this.pBullet.create, this.pBullet);
	            let comp = bullet.getComponent(Bullet);
	            comp.level = this.heroModel.bulletLevel;
	            if (i % 2 == 0) {
	                comp.x = -i * 2;
	            }
	            else {
	                comp.x = (i + 1) * 2;
	            }
	            this.gameBox.addChild(bullet);
	            let x = this.hero.x - Config.bulletWidth / 2;
	            let y = this.hero.y - Config.heroHeight / 2 - Config.bulletHeight;
	            bullet.pos(x, y);
	        }
	        Laya.SoundManager.playSound("sound/bullet.mp3");
	    }
	    createEnemy() {
	        let level = Util.Random(3);
	        let hp = Util.Random(level * 5);
	        ;
	        let name = "enemy" + level;
	        let enemy;
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
	    createUfoBomb() {
	        let name = "ufo_bomb";
	        let bomb = Laya.Pool.getItemByCreateFun(name, this.pUfoBomb.create, this.pUfoBomb);
	        let comp = bomb.getComponent(Ufo);
	        comp.gameControl = this;
	        comp.name = name;
	        this.gameBox.addChild(bomb);
	    }
	    createUfoBullet() {
	        let name = "ufo_bullet";
	        let bullet = Laya.Pool.getItemByCreateFun(name, this.pUfoBullet.create, this.pUfoBullet);
	        let comp = bullet.getComponent(Ufo);
	        comp.gameControl = this;
	        comp.name = name;
	        comp.level = Util.Random(2);
	        this.gameBox.addChild(bullet);
	    }
	    createBuff(name, cd) {
	        let buff = this.gameScene.buff.getChildByName(name);
	        if (buff) {
	            let comp = buff.getComponent(Buff);
	            comp.cd = cd;
	            comp.cur = 0;
	            return;
	        }
	        buff = Laya.Pool.getItemByCreateFun("buff", this.pBuff.create, this.pBuff);
	        buff.name = name;
	        let comp = buff.getComponent(Buff);
	        comp.gameControl = this;
	        comp.name = name;
	        comp.cd = cd;
	        this.gameScene.buff.addChild(buff);
	    }
	    cleanBuff() {
	        this.gameScene.buff.removeChildren(0, this.gameScene.buff.numChildren);
	    }
	    cleanGameBox() {
	        this.gameBox.alpha = 1;
	        this.gameBox.removeChildren(0, this.gameBox.numChildren);
	    }
	    cleanEnemy() {
	        let count = this.gameBox.numChildren;
	        for (let i = 0; i < count; i++) {
	            let child = this.gameBox.getChildAt(i);
	            if (child.name == "enemy") {
	                let comp = child.getComponent(Enemy);
	                comp.down();
	            }
	        }
	    }
	    onUseBomb() {
	        if (this.totalBomb == 0) {
	            return;
	        }
	        Laya.SoundManager.playSound("sound/use_bomb.mp3");
	        this.totalBomb--;
	        this.gameScene.showBomb();
	        this.cleanEnemy();
	    }
	    buffBulletEnd() {
	        this.heroModel.bulletLevel = 1;
	        this.heroModel.bulletCount = this.heroModel.bulletCountDefault;
	    }
	    buffGodEnd() {
	        this.heroModel.god = false;
	    }
	}

	class Background extends Laya.Script {
	    constructor() {
	        super();
	    }
	    onEnable() {
	        this.parent = this.owner;
	        this.speed = 5;
	        for (let i = 0; i < 2; i++) {
	            this.createBg(i);
	        }
	    }
	    onDisable() {
	    }
	    onUpdate() {
	        this.run();
	    }
	    createBg(index) {
	        let bg = new Laya.Image();
	        bg.loadImage("image/background.png");
	        bg.width = this.width;
	        bg.height = this.height;
	        bg.pos(0, -this.height * index);
	        this.parent.addChild(bg);
	    }
	    run() {
	        if (this.parent.numChildren != 2) {
	            return;
	        }
	        if (this.gameControl && this.gameControl.pause) {
	            this.speed = 0.1;
	        }
	        else {
	            this.speed = 5;
	        }
	        this.parent.y += this.speed;
	        let move = Math.abs(this.parent.y);
	        if (move >= this.height) {
	            this.parent.y -= this.height;
	        }
	    }
	}

	class Adjust {
	    static adjustScene(caller) {
	        if (!caller) {
	            return;
	        }
	        let scale = Laya.Browser.clientWidth / Laya.Browser.clientHeight;
	        switch (Laya.stage.scaleMode) {
	            case "fixedwidth":
	                caller.height = caller.width / scale;
	                break;
	            case "fixedheight":
	                caller.width = caller.height * scale;
	                break;
	        }
	        Adjust.adjustUI(caller.scaleGroup);
	    }
	    static adjustUI(b) {
	        if (!b) {
	            return;
	        }
	        if (Laya.Browser.clientHeight / Laya.Browser.clientWidth > 2) {
	            b.top = 25;
	            b.bottom = 50;
	        }
	    }
	}

	class GameScene extends ui.scene.gameSceneUI {
	    constructor() {
	        super();
	    }
	    onAwake() {
	        Adjust.adjustScene(this);
	    }
	    onEnable() {
	        GameScene.Ins = this;
	        this.gameControl = this.getComponent(GameControl);
	        this.gameControl.gameScene = this;
	        this.init();
	        this.onBackground();
	        this.onContinue();
	        this.onRestart();
	        this.onBack();
	        this.onUseBomb();
	    }
	    onDisable() {
	    }
	    init() {
	        this.gameControl.init();
	        this.showBtnContinue();
	        this.gameControl.heroModel.init();
	        this.gameControl.cleanGameBox();
	        this.gameControl.createHero();
	        this.showScore();
	        this.showBomb();
	        this.result.visible = false;
	        this.resultScore.visible = false;
	    }
	    onBackground() {
	        this.music = Laya.SoundManager.playMusic("sound/game_music.mp3", 0);
	        let comp = this.background.getComponent(Background);
	        comp.gameControl = this.gameControl;
	        comp.width = this.width;
	        comp.height = this.height;
	    }
	    onContinue() {
	        Util.ClickButton(this.btnContinue, this, function () {
	            this.gameControl.createHero();
	            this.gameBox.alpha = 1;
	            this.result.visible = false;
	            this.resultScore.visible = false;
	        });
	    }
	    onRestart() {
	        Util.ClickButton(this.btnRestart, this, function () {
	            this.init();
	        });
	    }
	    onBack() {
	        Util.ClickButton(this.btnBack, this, function () {
	            this.gameControl.heroModel.deathCount = 0;
	            this.music.stop();
	            Laya.Scene.open("scene/loginScene.scene");
	        });
	    }
	    onUseBomb() {
	        this.btnBomb.on(Laya.Event.CLICK, this, function () {
	            if (this.gameControl.totalBomb == 0 || this.gameControl.heroModel.death) {
	                return;
	            }
	            Laya.SoundManager.playSound("sound/use_bomb.mp3");
	            this.gameControl.totalBomb--;
	            this.showBomb();
	            this.gameControl.cleanEnemy();
	        });
	    }
	    showBtnContinue() {
	        if (this.gameControl.heroModel.deathCount > 0) {
	            this.btnContinue.visible = true;
	            this.tips.visible = true;
	            this.btnRestart.pos(this.btnRestart.x, this.btnRestart.y + 90);
	            this.btnBack.pos(this.btnBack.x, this.btnBack.y + 90);
	        }
	    }
	    hideBtnContinue() {
	        this.btnContinue.visible = false;
	        this.tips.visible = false;
	        this.btnRestart.pos(this.btnRestart.x, this.btnRestart.y - 90);
	        this.btnBack.pos(this.btnBack.x, this.btnBack.y - 90);
	    }
	    showScore() {
	        this.score.changeText(this.gameControl.totalScore.toString());
	    }
	    showBomb() {
	        this.bomb.changeText("X " + this.gameControl.totalBomb);
	    }
	    showCurScore() {
	        this.curScore.changeText(this.gameControl.totalScore.toString());
	    }
	    showMaxScore() {
	        this.maxScore.changeText(this.gameControl.totalScore.toString());
	    }
	}

	class LoginScene extends ui.scene.loginSceneUI {
	    constructor() {
	        super();
	    }
	    onAwake() {
	        Adjust.adjustScene(this);
	    }
	    onEnable() {
	        this.setting.visible = false;
	        this.onBackground();
	        this.onBtnStart();
	        this.onBtnRank();
	        this.onBtnSetting();
	        this.onBtnMusic();
	        this.onBtnSound();
	        this.onBtnBack();
	    }
	    onDisable() {
	    }
	    onBackground() {
	        Laya.SoundManager.useAudioMusic = false;
	        let comp = this.background.getComponent(Background);
	        comp.width = this.width;
	        comp.height = this.height;
	    }
	    onBtnStart() {
	        Util.ClickButton(this.btnStart, this, function () {
	            Laya.Scene.open("scene/gameScene.scene");
	        });
	    }
	    onBtnRank() {
	        Util.ClickButton(this.btnRank, this, function () {
	        });
	    }
	    onBtnSetting() {
	        Util.ClickButton(this.btnSetting, this, function () {
	            this.menu.visible = false;
	            this.setting.visible = true;
	        });
	    }
	    onBtnMusic() {
	        Util.ClickButton(this.btnMusic, this, function () {
	            if (this.btnMusic.label == "开启") {
	                this.btnMusic.label = "关闭";
	                Laya.SoundManager.musicMuted = true;
	            }
	            else {
	                this.btnMusic.label = "开启";
	                Laya.SoundManager.musicMuted = false;
	            }
	        });
	    }
	    onBtnSound() {
	        Util.ClickButton(this.btnSound, this, function () {
	            if (this.btnSound.label == "开启") {
	                this.btnSound.label = "关闭";
	                Laya.SoundManager.soundMuted = true;
	            }
	            else {
	                this.btnSound.label = "开启";
	                Laya.SoundManager.soundMuted = false;
	            }
	        });
	    }
	    onBtnBack() {
	        Util.ClickButton(this.btnBack, this, function () {
	            this.menu.visible = true;
	            this.setting.visible = false;
	        });
	    }
	}

	class GameConfig {
	    constructor() { }
	    static init() {
	        var reg = Laya.ClassUtils.regClass;
	        reg("view/game/GameScene.ts", GameScene);
	        reg("view/game/Background.ts", Background);
	        reg("view/game/GameControl.ts", GameControl);
	        reg("view/login/LoginScene.ts", LoginScene);
	        reg("view/game/Hero.ts", Hero);
	        reg("view/game/Buff.ts", Buff);
	        reg("view/game/Bullet.ts", Bullet);
	        reg("view/game/Enemy.ts", Enemy);
	        reg("view/game/Ufo.ts", Ufo);
	    }
	}
	GameConfig.width = 640;
	GameConfig.height = 960;
	GameConfig.scaleMode = "fixedwidth";
	GameConfig.screenMode = "none";
	GameConfig.alignV = "top";
	GameConfig.alignH = "left";
	GameConfig.startScene = "scene/loginScene.scene";
	GameConfig.sceneRoot = "";
	GameConfig.debug = false;
	GameConfig.stat = false;
	GameConfig.physicsDebug = false;
	GameConfig.exportSceneToJson = true;
	GameConfig.init();

	class Main {
	    constructor() {
	        if (window["Laya3D"])
	            Laya3D.init(GameConfig.width, GameConfig.height);
	        else
	            Laya.init(GameConfig.width, GameConfig.height, Laya["WebGL"]);
	        Laya["Physics"] && Laya["Physics"].enable();
	        Laya["DebugPanel"] && Laya["DebugPanel"].enable();
	        Laya.stage.scaleMode = GameConfig.scaleMode;
	        Laya.stage.screenMode = GameConfig.screenMode;
	        Laya.stage.alignV = GameConfig.alignV;
	        Laya.stage.alignH = GameConfig.alignH;
	        Laya.URL.exportSceneToJson = GameConfig.exportSceneToJson;
	        if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true")
	            Laya.enableDebugPanel();
	        if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"])
	            Laya["PhysicsDebugDraw"].enable();
	        if (GameConfig.stat)
	            Laya.Stat.show();
	        Laya.alertGlobalError = true;
	        Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
	    }
	    onVersionLoaded() {
	        Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
	    }
	    onConfigLoaded() {
	        GameConfig.startScene && Laya.Scene.open(GameConfig.startScene);
	    }
	    ;
	}
	new Main();

}());
//# sourceMappingURL=bundle.js.map
