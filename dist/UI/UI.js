import { FlipCorner, FlippingState } from '../BasicTypes';
import { Orientation } from '../Settings';
import { ClickFlipType } from '../Settings';
/**
 * UI Class, represents work with DOM
 */
export class UI {
    parentElement;
    app;
    wrapper;
    distElement;
    touchPoint = null;
    swipeTimeout = 250;
    swipeDistance;
    onResize = () => {
        this.update();
    };
    /**
     * @constructor
     *
     * @param {HTMLElement} inBlock - Root HTML Element
     * @param {PageFlip} app - PageFlip instanse
     * @param {FlipSetting} setting - Configuration object
     */
    constructor(inBlock, app) {
        this.parentElement = inBlock;
        inBlock.classList.add('stf__parent');
        // Add first wrapper
        inBlock.insertAdjacentHTML('afterbegin', '<div class="stf__wrapper"></div>');
        this.wrapper = inBlock.querySelector('.stf__wrapper');
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
    destroy() {
        // if (this.app.getSettings().useMouseEvents) this.removeHandlers();
        this.removeHandlers();
        this.distElement.remove();
        this.wrapper.remove();
    }
    /**
     * Get parent element for book
     *
     * @returns {HTMLElement}
     */
    getDistElement() {
        return this.distElement;
    }
    /**
     * Get wrapper element
     *
     * @returns {HTMLElement}
     */
    getWrapper() {
        return this.wrapper;
    }
    /**
     * Updates styles and sizes based on book orientation
     *
     * @param {Orientation} orientation - New book orientation
     */
    setOrientationStyle(orientation) {
        this.wrapper.classList.remove('--portrait', '--landscape');
        if (orientation === Orientation.PORTRAIT) {
            this.wrapper.classList.add('--portrait');
        }
        else if (orientation === Orientation.LANDSCAPE) {
            this.wrapper.classList.add('--landscape');
        }
        this.update();
    }
    removeHandlers() {
        window.removeEventListener('resize', this.onResize);
        this.distElement.removeEventListener('mousedown', this.onMouseDown);
        this.distElement.removeEventListener('touchstart', this.onTouchStart);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('touchmove', this.onTouchMove);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('touchend', this.onTouchEnd);
    }
    setHandlers() {
        window.addEventListener('resize', this.onResize, false);
        const clickFlipType = this.app.getSettings().clickFlipType;
        if (clickFlipType == ClickFlipType.DISABLE_FLIPPING ||
            clickFlipType == ClickFlipType.ONLY_VIA_API) {
            return;
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
    getMousePos(x, y) {
        const rect = this.distElement.getBoundingClientRect();
        return {
            x: x - rect.left,
            y: y - rect.top,
        };
    }
    checkTarget(targer) {
        if (!this.app.getSettings().clickEventForward)
            return true;
        if (['a', 'button', 'input'].includes(targer.tagName.toLowerCase())) {
            return false;
        }
        return true;
    }
    onMouseDown = (e) => {
        // on the book
        if (this.checkTarget(e.target)) {
            const pos = this.getMousePos(e.clientX, e.clientY);
            this.app.startUserTouch(pos);
            e.preventDefault();
        }
    };
    // on the book element
    onTouchStart = (e) => {
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
                if (!this.app.getSettings().mobileScrollSupport)
                    e.preventDefault();
            }
        }
    };
    onMouseUp = (e) => {
        const pos = this.getMousePos(e.clientX, e.clientY);
        this.app.userStop(pos);
    };
    onMouseMove = (e) => {
        const pos = this.getMousePos(e.clientX, e.clientY);
        this.app.userMove(pos, false);
    };
    onTouchMove = (e) => {
        if (e.changedTouches.length > 0) {
            const t = e.changedTouches[0];
            const pos = this.getMousePos(t.clientX, t.clientY);
            if (this.app.getSettings().mobileScrollSupport) {
                if (this.touchPoint !== null) {
                    if (Math.abs(this.touchPoint.point.x - pos.x) > 10 ||
                        this.app.getState() !== FlippingState.READ) {
                        if (e.cancelable)
                            this.app.userMove(pos, true);
                    }
                }
                if (this.app.getState() !== FlippingState.READ) {
                    e.preventDefault();
                }
            }
            else {
                this.app.userMove(pos, true);
            }
        }
    };
    onTouchEnd = (e) => {
        if (e.changedTouches.length > 0) {
            const t = e.changedTouches[0];
            const pos = this.getMousePos(t.clientX, t.clientY);
            let isSwipe = false;
            // swipe detection
            if (this.touchPoint !== null) {
                const dx = pos.x - this.touchPoint.point.x;
                const distY = Math.abs(pos.y - this.touchPoint.point.y);
                if (Math.abs(dx) > this.swipeDistance &&
                    distY < this.swipeDistance * 2 &&
                    Date.now() - this.touchPoint.time < this.swipeTimeout) {
                    if (dx > 0) {
                        this.app.flipPrev(this.touchPoint.point.y < this.app.getRender().getRect().height / 2
                            ? FlipCorner.TOP
                            : FlipCorner.BOTTOM);
                    }
                    else {
                        this.app.flipNext(this.touchPoint.point.y < this.app.getRender().getRect().height / 2
                            ? FlipCorner.TOP
                            : FlipCorner.BOTTOM);
                    }
                    isSwipe = true;
                }
                this.touchPoint = null;
            }
            this.app.userStop(pos, isSwipe);
        }
    };
}
//# sourceMappingURL=UI.js.map