import { FlippingState } from './BasicTypes';
import { Orientation } from './Settings';
import { type FlipSetting } from './Settings';
import { defaultSettings } from './Settings';
import { FlipDirection } from './BasicTypes';
import { FlipCorner } from './BasicTypes';
import type { Point, PageRect, RectPoints } from './BasicTypes';
import { PageDensity, PageOrientation} from './BasicTypes';
// import type {PageState } from './BasicTypes';

export type FrameAction = () => void;
export type AnimationSuccessAction = () => void;
export const zeroPoint: Point = { x: 0, y: 0 };

// interfaces for App
export interface IPageCollection {
    load(): void;
    destroy(): void;
    getSpreadIndexByPage(pageNum: number): number;
    getPageCount(): number;
    getPages(): IPage[];
    getPage(pageIndex: number): IPage | null;
    nextBy(current: IPage): IPage | null;
    prevBy(current: IPage): IPage | null; 
    getFlippingPage(direction: FlipDirection): IPage | null;
    getBottomPage(direction: FlipDirection): IPage | null;
    showNext():void;
    showPrev(): void ;
    getCurrentPageIndex(): number;
    show(pageNum: number | null): void;
    getCurrentSpreadIndex(): number;
    setCurrentSpreadIndex(newIndex: number): void;

}
export interface IPage {
    simpleDraw(orient: PageOrientation): void;
    draw(tempDensity: PageDensity | null): void;
    load(): void;
    setDensity(density: PageDensity): void;
    setDrawingDensity(density: PageDensity): void;
    setPosition(pagePos: Point): void;
    setAngle(angle: number): void;
    setArea(area: (Point|null)[]): void ;
    setHardDrawingAngle(angle: number): void;
    setHardAngle(angle: number): void;
    setOrientation(orientation: PageOrientation): void;
    getDrawingDensity(): PageDensity ;
    getDensity(): PageDensity;
    getHardAngle(): number ;

    newTemporaryCopy(): IPage;
    getTemporaryCopy(): IPage| null;
    hideTemporaryCopy(): void;
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
    getDirection(): FlipDirection ;
    setPageRect(pageRect: RectPoints): void;

    setRightPage(page: IPage | null): void;
    setLeftPage(page: IPage | null): void;
    setBottomPage(page: IPage | null): void;
    setFlippingPage(page: IPage | null): void;

    setShadowData(pos: Point, angle: number, progress: number, direction: FlipDirection): void
    clearShadow(): void;
    getBlockWidth(): number;
    getBlockHeight(): number;
    convertRectToGlobal(rect: RectPoints, direction?: FlipDirection): RectPoints;
}

export interface IUI {
    getDistElement: () => HTMLElement | null;
    removeHandlers(): void;
    setHandlers(): void;
    destroy(): void;
    update(): void;
    clear(): void;
    setOrientationStyle(orientation: Orientation): void;
}
export interface IApp {
    setSettings(settings:FlipSetting): void;
    destroy(): void;
    update(): void;
    clear(): void;
    loadFromImages(imagesHref: string[]): void;
    updateFromImages(imagesHref: string[]): void;
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    updateFromHtml(items: NodeListOf<HTMLElement> | HTMLElement[]): void;

    turnToPrevPage(): void;
    turnToNextPage(): void;
    turnToPage(page: number): void;

    flipPrev(corner:FlipCorner): void;
    flipNext(corner:FlipCorner): void;
    flipToPage(page: number, corner: FlipCorner): void;

    updateOrientation: (orientation: Orientation) => void;
    updateState(newState: FlippingState): void;
    updatePageIndex(newPage: number): void;
    getPageCount(): number;
    getCurrentPageIndex(): number;
    getUI(): IUI;
    getRender(): IRender;
    getPage(pageIndex: number): IPage | null;
    getSettings(): FlipSetting;
    getState(): FlippingState;
    getPageCollection(): IPageCollection;
    startUserTouch(pos: { x: number, y: number }): void;
    userStop(pos: Point, isSwipe?:boolean ): void;
    userMove(pos: Point, isTouch: boolean): void;

}


export class NoOpRender implements IRender
{
    private rect: PageRect = { pageWidth: 0 , width: 0, height: 0, top: 0, left: 0 };
    private rectPoint: RectPoints = { topLeft: { x: 0, y: 0 }, topRight: { x: 0, y: 0 }, bottomLeft: { x: 0, y: 0 }, bottomRight: { x: 0, y: 0 } };

    constructor() {}
    public start(): void {};
    public update(): void {};
    public reload(): void {};
    public startAnimation(frames: FrameAction[],duration: number, onAnimateEnd: AnimationSuccessAction): void {};
    public finishAnimation(): void {};
    public getSettings(): FlipSetting { return defaultSettings; };
    public getRect(): PageRect { return this.rect;}; 
    public isSafari(): boolean { return false; };
    public convertToGlobal(pos: Point, direction?: FlipDirection): Point { return { x: 0, y: 0 }; };
    public convertToPage(pos: Point, direction?: FlipDirection): Point { return { x: 0, y: 0 }; };
    public convertToBook(pos: Point): Point { return { x: 0, y: 0 }; };
    public getOrientation(): Orientation { return Orientation.PORTRAIT; };
    public setDirection(direction: FlipDirection): void {};
    public getDirection(): FlipDirection { return FlipDirection.FORWARD; };
    public setPageRect(pageRect: RectPoints): void {};
    public setRightPage(page: IPage | null): void {};
    public setLeftPage(page: IPage | null): void {};
    public setBottomPage(page: IPage | null): void {};
    public setFlippingPage(page: IPage | null): void {};
    public setShadowData(pos: Point, angle: number, progress: number,direction: FlipDirection): void {};
    public clearShadow(): void {};
    public getBlockWidth(): number { return 0; };
    public getBlockHeight(): number { return 0; };
    public convertRectToGlobal(rect: RectPoints, direction?: FlipDirection): RectPoints { 
        return this.rectPoint; 
    }; 
}
export class NoOpUI implements IUI {
    public getDistElement: () => HTMLElement | null = () => null;
    public removeHandlers(): void {};
    public setHandlers(): void {};
    public destroy(): void {};
    public update(): void {};
    public clear(): void {};
    public setOrientationStyle(orientation: Orientation): void {};
}

export class NoOpPageCollection implements IPageCollection
{
    public load(): void {};
    public destroy(): void {};
    public getSpreadIndexByPage(pageNum: number): number { return 0; };
    public getPageCount(): number { return 0; };
    public getPages(): IPage[] { return []; };
    public getPage(pageIndex: number): IPage | null { return null; };
    public nextBy(current: IPage): IPage | null { return null; };
    public prevBy(current: IPage): IPage | null { return null; };
    public getFlippingPage(direction: FlipDirection): IPage | null { return null; };
    public getBottomPage(direction: FlipDirection): IPage | null { return null; };
    public showNext():void {};
    public showPrev(): void {};
    public getCurrentPageIndex(): number { return 0; };
    public show(pageNum: number | null): void {};
    public getCurrentSpreadIndex(): number { return 0; };
    public setCurrentSpreadIndex(newIndex: number): void {};
}