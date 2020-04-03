import { ui } from "../../ui/layaMaxUI";
import Util from "../../common/Util";
import GameControl from "./GameControl";
import Background from "./Background";
import Adjust from "../Adjust";

export default class GameScene extends ui.scene.gameSceneUI {
    static Ins: GameScene;
    private gameControl: GameControl;
    private music: Laya.SoundChannel;

    constructor() {
        super();
    }

    onAwake(): void {
        Adjust.adjustScene(this);
    }

    onEnable(): void {
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

    onDisable(): void {

    }

    // 初始化
    init(): void {
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

    // 背景
    onBackground(): void {
        // 播放背景音乐
        this.music = Laya.SoundManager.playMusic("sound/game_music.mp3", 0);

        let comp = this.background.getComponent(Background);
        comp.gameControl = this.gameControl;
        comp.width = this.width;
        comp.height = this.height;
    }

    // 复活继续
    onContinue(): void {
        Util.ClickButton(this.btnContinue, this, function () {
            this.gameControl.createHero();

            this.gameBox.alpha = 1;
            this.result.visible = false;
            this.resultScore.visible = false;
        });
    }

    // 重新开始
    onRestart(): void {
        Util.ClickButton(this.btnRestart, this, function () {
            this.init();
        });
    }

    // 回到首页
    onBack(): void {
        Util.ClickButton(this.btnBack, this, function () {
            // 重置复活次数
            this.gameControl.heroModel.deathCount = 0;

            // 关闭背景音乐
            this.music.stop();

            // 清理对象池 TODO...

            // 打开首页场景
            Laya.Scene.open("scene/loginScene.scene");
        });
    }

    // 使用炸弹
    onUseBomb(): void {
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

    // 显示复活按钮
    showBtnContinue(): void {
        // 之前使用过复活按钮,需要还原复活按钮
        if (this.gameControl.heroModel.deathCount > 0) {
            this.btnContinue.visible = true;
            this.tips.visible = true;

            // 其他按钮位置还原
            this.btnRestart.pos(this.btnRestart.x, this.btnRestart.y + 90);
            this.btnBack.pos(this.btnBack.x, this.btnBack.y + 90);
        }
    }

    // 隐藏复活按钮
    hideBtnContinue(): void {
        this.btnContinue.visible = false;
        this.tips.visible = false;

        // 其他按钮上移
        this.btnRestart.pos(this.btnRestart.x, this.btnRestart.y - 90);
        this.btnBack.pos(this.btnBack.x, this.btnBack.y - 90);
    }

    // 显示分数
    showScore(): void {
        this.score.changeText(this.gameControl.totalScore.toString());
    }

    // 显示炸弹数
    showBomb(): void {
        this.bomb.changeText("X " + this.gameControl.totalBomb);
    }

    // 显示本局得分
    showCurScore(): void {
        this.curScore.changeText(this.gameControl.totalScore.toString());
    }

    // 显示历史最高
    showMaxScore(): void {
        this.maxScore.changeText(this.gameControl.totalScore.toString());
    }
}