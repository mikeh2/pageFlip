import type { Point } from '../BasicTypes';
import { FlipCorner, FlippingState } from '../BasicTypes';
import { Orientation } from '../Settings';
import { ClickFlipType} from '../Settings';
import { IUI, IApp } from '../BasicInterfaces';
// import { PageFlip } from '../PageFlip';

type SwipeData = {
    point: Point;
    time: number;
};

/**
 * UI Class, represents work with DOM
 */
export abstract class UI implements IUI {
    protected readonly parentElement: HTMLElement;

    protected readonly app: IApp;
    protected readonly wrapper: HTMLElement;
    protected distElement: HTMLElement;

    private touchPoint: SwipeData | null = null;
    private readonly swipeTimeout = 250;
    private readonly swipeDistance: number;

    private onResize = (): void => {
        this.update();
    };

    /**
     * @constructor
     *
     * @param {HTMLElement} inBlock - Root HTML Element
     * @param {PageFlip} app - PageFlip instanse
     */
    protected constructor(inBlock: HTMLElement, app: IApp) {
        this.parentElement = inBlock;

        inBlock.classList.add('stf__parent');
        // Add first wrapper
        inBlock.insertAdjacentHTML('afterbegin', '<div class="stf__wrapper"></div>');

        let ele:HTMLElement | null = inBlock.querySelector('.stf__wrapper');
        if (ele === null) {
            throw new Error('Element not found');
        }
        this.wrapper = ele
        this.distElement = ele;

        this.app = app;
        inBlock.style.minWidth = this.app.getSettings().width + 'px';
        inBlock.style.minHeight = this.app.getSettings().height + 'px';
        inBlock.style.maxWidth = this.app.getSettings().width + 'px';
        inBlock.style.maxHeight = this.app.getSettings().height + 'px';
        inBlock.style.display = 'block';

        window.addEventListener('resize', this.onResize, false);
        this.swipeDistance = this.app.getSettings().swipeDistance;
    }

    /**
     * Destructor. Remove all HTML elements and all event handlers
     */
    public destroy(): void {

        // if (this.app.getSettings().useMouseEvents) this.removeHandlers();
        this.removeHandlers();

        this.distElement.remove();
        this.wrapper.remove();
    }

    /**
     * Updating child components when resizing
     */
    public abstract update(): void;
    public abstract clear(): void;

    /**
     * Get parent element for book
     *
     * @returns {HTMLElement}
     */
    public getDistElement(): HTMLElement {
        return this.distElement;
    }

    /**
     * Get wrapper element
     *
     * @returns {HTMLElement}
     */
    public getWrapper(): HTMLElement {
        return this.wrapper;
    }

    /**
     * Updates styles and sizes based on book orientation
     *
     * @param {Orientation} orientation - New book orientation
     */
    public setOrientationStyle(orientation: Orientation): void {
        this.wrapper.classList.remove('--portrait', '--landscape');

        if (orientation === Orientation.PORTRAIT) {
            this.wrapper.classList.add('--portrait');
        }else if (orientation === Orientation.LANDSCAPE) {
            this.wrapper.classList.add('--landscape');
        }
        this.update()
    }

    public removeHandlers(): void {
        window.removeEventListener('resize', this.onResize);

        this.distElement.removeEventListener('mousedown', this.onMouseDown);
        this.distElement.removeEventListener('touchstart', this.onTouchStart);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('touchmove', this.onTouchMove);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('touchend', this.onTouchEnd);
    }

    public setHandlers(): void {
        window.addEventListener('resize', this.onResize, false);

        const clickFlipType = this.app.getSettings().clickFlipType;
        if (clickFlipType == ClickFlipType.DISABLE_FLIPPING || 
            clickFlipType == ClickFlipType.ONLY_VIA_API) {
                return
        }
        // if (!this.app.getSettings().useMouseEvents) return;

        this.distElement.addEventListener('mousedown', this.onMouseDown);
        this.distElement.addEventListener('touchstart', this.onTouchStart);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('touchmove', this.onTouchMove, {
            passive: !this.app.getSettings().mobileScrollSupport,
        });
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('touchend', this.onTouchEnd);
    }

    /**
     * Convert global coordinates to relative book coordinates
     *
     * @param x
     * @param y
     */
    private getMousePos(x: number, y: number): Point {
        const rect = this.distElement.getBoundingClientRect();

        return {
            x: x - rect.left,
            y: y - rect.top,
        };
    }

    private checkTarget(targer: EventTarget | null): boolean {

        if (!this.app.getSettings().clickEventForward) return true;

        if (['a', 'button', 'input'].includes((targer as HTMLElement).tagName.toLowerCase())) {
            return false;
        }

        return true;
    }

    private onMouseDown = (e: MouseEvent): void => {
        // on the book
        if (this.checkTarget(e.target)) {
            const pos = this.getMousePos(e.clientX, e.clientY);

            this.app.startUserTouch(pos);

            e.preventDefault();
        }
    };

    // on the book element
    private onTouchStart = (e: TouchEvent): void => {
        if (this.checkTarget(e.target)) {
            if (e.changedTouches.length > 0) {
                const t = e.changedTouches[0];
                const pos = this.getMousePos(t.clientX, t.clientY);

                this.touchPoint = {
                    point: pos,
                    time: Date.now(),
                };

                // part of swipe detection
                setTimeout(() => {
                    if (this.touchPoint !== null) {
                        this.app.startUserTouch(pos);
                    }
                }, this.swipeTimeout);

                if (!this.app.getSettings().mobileScrollSupport) e.preventDefault();
            }
        }
    };

    private onMouseUp = (e: MouseEvent): void => {
        const pos = this.getMousePos(e.clientX, e.clientY);

        this.app.userStop(pos);
    };

    private onMouseMove = (e: MouseEvent): void => {
        const pos = this.getMousePos(e.clientX, e.clientY);

        this.app.userMove(pos, false);
    };

    private onTouchMove = (e: TouchEvent): void => {
        if (e.changedTouches.length > 0) {
            const t = e.changedTouches[0];
            const pos = this.getMousePos(t.clientX, t.clientY);

            if (this.app.getSettings().mobileScrollSupport) {
                if (this.touchPoint !== null) {
                    if (
                        Math.abs(this.touchPoint.point.x - pos.x) > 10 ||
                        this.app.getState() !== FlippingState.READ
                    ) {
                        if (e.cancelable) this.app.userMove(pos, true);
                    }
                }

                if (this.app.getState() !== FlippingState.READ) {
                    e.preventDefault();
                }
            } else {
                this.app.userMove(pos, true);
            }
        }
    };

    private onTouchEnd = (e: TouchEvent): void => {
        if (e.changedTouches.length > 0) {
            const t = e.changedTouches[0];
            const pos = this.getMousePos(t.clientX, t.clientY);
            let isSwipe = false;

            // swipe detection
            if (this.touchPoint !== null) {
                const dx = pos.x - this.touchPoint.point.x;
                const distY = Math.abs(pos.y - this.touchPoint.point.y);

                if (
                    Math.abs(dx) > this.swipeDistance &&
                    distY < this.swipeDistance * 2 &&
                    Date.now() - this.touchPoint.time < this.swipeTimeout
                ) {
                    if (dx > 0) {
                        this.app.flipPrev(
                            this.touchPoint.point.y < this.app.getRender().getRect().height / 2
                                ? FlipCorner.TOP
                                : FlipCorner.BOTTOM
                        );
                    } else {
                        this.app.flipNext(
                            this.touchPoint.point.y < this.app.getRender().getRect().height / 2
                                ? FlipCorner.TOP
                                : FlipCorner.BOTTOM
                        );
                    }
                    isSwipe = true;
                }

                this.touchPoint = null;
            }

            this.app.userStop(pos, isSwipe);
        }
    };
}
