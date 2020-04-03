export default class Adjust {
    // 场景适配
    static adjustScene(caller: any): void {
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

    // ui适配
    static adjustUI(b: Laya.Box): void {
        if (!b) {
            return;
        }

        // 全面屏
        if (Laya.Browser.clientHeight / Laya.Browser.clientWidth > 2) {
            b.top = 25;
            b.bottom = 50;
        }
    }
}