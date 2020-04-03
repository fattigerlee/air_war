export default class Util {
    // 点击按钮
    static ClickButton(button: Laya.Button, caller: any, listener: Function) {
        button.on(Laya.Event.CLICK, caller, function () {
            // 按钮音效
            Laya.SoundManager.playSound("sound/button.mp3");

            listener.bind(caller)();
        });
    }

    // 生成随机数
    static Random(num: number): number {
        let today = new Date();
        let seed = today.getTime();
        return Math.ceil(this.rnd(seed) * num);
    }

    private static rnd(seed: number): number {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / (233280.0);
    }

    // 大小改变更改适配
    static resize(): void {
        Laya.Scene.unDestroyedScenes.forEach((scene) => {
            Util.adjustScene(scene);
            Util.adjustUI(scene.scaleGroup);
        });
    }

    // 场景适配
    static adjustScene(caller: any): void {
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

    // ui适配
    static adjustUI(b: Laya.Box): void {
        if (!b) {
            return;
        }

        // 全面屏
        if (Laya.Browser.height / Laya.Browser.width > 2) {
            console.log("全面屏...");
            b.top = 25;
            b.bottom = 50;
        }
    }
}