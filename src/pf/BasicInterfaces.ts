import { FlippingState } from './BasicTypes';
import { Orientation } from './Settings';
import { FlipSetting } from './Settings';
import { FlipDirection } from './BasicTypes';
import { FlipCorner } from './BasicTypes';
import type { Point, PageRect, RectPoints } from './BasicTypes';
import { PageDensity, PageOrientation} from './BasicTypes';
// import type {PageState } from './BasicTypes';

export type FrameAction = () => void;
export type AnimationSuccessAction = () => void;

// interfaces for App
export interface IPage {
    simpleDraw(orient: PageOrientation): void;
    draw(tempDensity?: PageDensity): void;
    load(): void;
    setDensity(density: PageDensity): void;
    setDrawingDensity(density: PageDensity): void;
    setPosition(pagePos: Point): void;
    setAngle(angle: number): void;
    setArea(area: Point[]): void ;
    setHardDrawingAngle(angle: number): void;
    setHardAngle(angle: number): void;
    setHardArea(area: Point[]): void;
    setOrientation(orientation: PageOrientation): void;
    getDrawingDensity(): PageDensity ;
    getDensity(): PageDensity;
    getHardAngle(): number ;
}
export interface IRender {
    start(): void;
    update(): void;
    reload(): void;
    startAnimation(frames: FrameAction[],duration: number, onAnimateEnd: AnimationSuccessAction): void ;
    finishAnimation(): void;
    getSettings(): FlipSetting;
    getRect(): PageRect; 
    isSafari(): boolean;
    convertToGlobal(pos: Point, direction?: FlipDirection): Point;
    convertToPage(pos: Point, direction?: FlipDirection): Point;
    convertToBook(pos: Point): Point
    getOrientation(): Orientation;
    setDirection(direction: FlipDirection): void;
    setPageRect(pageRect: RectPoints): void;
    setRightPage(page: IPage): void;
    setLeftPage(page: IPage): void;
    setBottomPage(page: IPage): void;
    setFlippingPage(page: IPage): void;
    setShadowData(pos: Point, angle: number, progress: number,direction: FlipDirection): void
    clearShadow(): void;
    getBlockWidth(): number;
    getBlockHeight(): number;
    convertRectToGlobal(rect: RectPoints, direction?: FlipDirection): RectPoints;
}

export interface IUI {
    getDistElement: () => HTMLElement;
    removeHandlers(): void;
    setHandlers(): void;
    destroy(): void;
    update(): void;
    clear(): void;
    setOrientationStyle(orientation: Orientation): void;
}
export interface IApp {
    updateOrientation: (orientation: Orientation) => void;
    getUI(): IUI;
    getRender(): IRender;
    getSettings(): FlipSetting;
    getState(): FlippingState;
    startUserTouch(pos: { x: number, y: number }): void;
    userStop(pos: { x: number, y: number }): void;
    userMove(pos: { x: number, y: number }, isTouch:boolean ): void;
    flipPrev(corner:FlipCorner): void;
    flipNext(corner:FlipCorner): void;

}
