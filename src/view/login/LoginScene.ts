import Util from "../../common/Util";
import { ui } from "../../ui/layaMaxUI";
import Background from "../game/Background";
import Adjust from "../Adjust";
import Hero from "../game/Hero";

export default class LoginScene extends ui.scene.loginSceneUI {
    constructor() {
        super();
    }

    onAwake(): void {
        Adjust.adjustScene(this);
    }

    onEnable(): void {
        this.setting.visible = false;

        this.onBackground();

        this.onBtnStart();

        this.onBtnRank();

        this.onBtnSetting();

        this.onBtnMusic();

        this.onBtnSound();

        this.onBtnBack();
    }

    onDisable(): void {

    }

    // 背景
    onBackground(): void {
        Laya.SoundManager.useAudioMusic = false;

        let comp = this.background.getComponent(Background);
        comp.width = this.width;
        comp.height = this.height;
    }

    // 开始游戏
    onBtnStart(): void {
        Util.ClickButton(this.btnStart, this, function () {
            // 打开游戏场景
            Laya.Scene.open("scene/gameScene.scene");
        });
    }

    // 排行榜
    onBtnRank(): void {
        Util.ClickButton(this.btnRank, this, function () {

        });
    }

    // 设置
    onBtnSetting(): void {
        Util.ClickButton(this.btnSetting, this, function () {
            this.menu.visible = false;
            this.setting.visible = true;
        });
    }

    // 音乐
    onBtnMusic(): void {
        Util.ClickButton(this.btnMusic, this, function () {
            if (this.btnMusic.label == "开启") {
                this.btnMusic.label = "关闭";
                Laya.SoundManager.musicMuted = true;
            } else {
                this.btnMusic.label = "开启";
                Laya.SoundManager.musicMuted = false;
            }
        });
    }

    // 音效
    onBtnSound(): void {
        Util.ClickButton(this.btnSound, this, function () {
            if (this.btnSound.label == "开启") {
                this.btnSound.label = "关闭";
                Laya.SoundManager.soundMuted = true;
            } else {
                this.btnSound.label = "开启";
                Laya.SoundManager.soundMuted = false;
            }
        });
    }

    // 回到游戏
    onBtnBack(): void {
        Util.ClickButton(this.btnBack, this, function () {
            this.menu.visible = true;
            this.setting.visible = false;
        });
    }
}