export default class EventManager {
    private eventDispatcher: Laya.EventDispatcher;

    constructor() {
        this.eventDispatcher = new Laya.EventDispatcher();
    }

    // 添加监听事件
    addListener(type: string, caller: any, listener: Function, args?: any[]): void {
        this.eventDispatcher.on(type, caller, listener, args);
    }

    // 派发事件
    dispatch(type: string, data?: any): void {
        this.eventDispatcher.event(type, data);
    }

    private static instance: EventManager;
    public static get Ins(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }
}