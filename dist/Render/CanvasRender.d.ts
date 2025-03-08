import { Render } from './Render';
import type { IApp } from '../BasicInterfaces';
/**
 * Class responsible for rendering the Canvas book
 */
export declare class CanvasRender extends Render {
    private readonly canvas;
    private readonly ctx;
    constructor(app: IApp, inCanvas: HTMLCanvasElement);
    getContext(): CanvasRenderingContext2D | null;
    reload(): void;
    protected drawFrame(): void;
    private drawBookShadow;
    private drawOuterShadow;
    private drawInnerShadow;
    private clear;
}
