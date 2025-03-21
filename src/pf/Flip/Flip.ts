import { Orientation } from '../Settings';
import { Helper } from '../Helper';
import { FlipCorner, FlipDirection, FlippingState, type PageRect, type Point } from '../BasicTypes';
import { FlipCalculation } from './FlipCalculation';
import { PageDensity } from '../BasicTypes';
import {ClickFlipType} from '../Settings';
// import { Page } from '../Page/Page';
// import { Render } from '../Render/Render';
// import { PageFlip } from '../PageFlip';
import type { IApp, IPage, IRender } from '../BasicInterfaces';

/**
 * Class representing the flipping process
 */
export class Flip {
    private readonly render: IRender;
    private readonly app: IApp;

    private flippingPage: IPage | null = null;
    private bottomPage: IPage | null = null;

    private calc: FlipCalculation | null = null;

    private state: FlippingState = FlippingState.READ;

    constructor(render: IRender, app: IApp) {
        this.render = render;
        this.app = app;
    }

    /**
     * Called when the page folding (User drags page corner)
     *
     * @param globalPos - Touch Point Coordinates (relative window)
     */
    public fold(globalPos: Point): void {

        let page_number = this.app.getCurrentPageIndex();
        let allow_fold = true;

        let flipType: ClickFlipType = this.app.getSettings().clickFlipType;
        const is_corner = this.isPointOnCorners(globalPos);

        console.log('fold', page_number, is_corner, flipType);
        let on_left = this.isPointOnLeftCorner(globalPos);
        console.log('on_left', on_left);
        let on_right = this.isPointOnRightCorner(globalPos);
        console.log('on_right', on_right);

        // if (flipType === ClickFlipType.ONLY_ON_LEFT_CORNER){
        //     allow_fold = on_left;
        // }
        // else if (flipType === ClickFlipType.ONLY_ON_RIGHT_CORNER){
        //     allow_fold = on_right;
        // }

        if (!allow_fold) return;


        this.setState(FlippingState.USER_FOLD);

        // If the process has not started yet
        if (this.calc === null) this.start(globalPos);

        this.do(this.render.convertToPage(globalPos));
    }

    /**
     * Page turning with animation
     *
     * @param globalPos - Touch Point Coordinates (relative window)
     */
    public flip(globalPos: Point): void {

        let flipType: ClickFlipType = this.app.getSettings().clickFlipType;
        let allow_flip:boolean = true;

        let page_number = this.app.getCurrentPageIndex();
        // console.log('flip request', page_number);

        if (flipType === ClickFlipType.DISABLE_FLIPPING){
            allow_flip = false;
        }
        if (flipType === ClickFlipType.ONLY_ON_CORNERS){
            allow_flip = this.isPointOnCorners(globalPos);
        }

        if (!allow_flip) return;

        // flipType is ONLY_VIA_API or ANYWHERE_ON_PAGE
        // orginal was disableFlipByClick && !this.isPointOnCorners(globalPos)
        // means you can flip the page by clicking on the corner

        // the flipiing process is already running
        if (this.calc !== null) this.render.finishAnimation();

        if (!this.start(globalPos)) return;

        const rect = this.getBoundsRect();

        this.setState(FlippingState.FLIPPING);

        // Margin from top to start flipping
        const topMargins = rect.height / 10;

        // Defining animation start points
        let yStart = topMargins;
        let yDest = 0;

        if (this.calc !== null) {
            yStart = this.calc.getCorner() === FlipCorner.BOTTOM ? rect.height - topMargins : topMargins;
        }

        if (this.calc !== null) {
            yDest = this.calc.getCorner() === FlipCorner.BOTTOM ? rect.height : 0;
            // Сalculations for these points
            this.calc.calc({ x: rect.pageWidth - topMargins, y: yStart });
        }

        // Run flipping animation
        this.animateFlippingTo(
            { x: rect.pageWidth - topMargins, y: yStart },
            { x: -rect.pageWidth, y: yDest },
            true
        );
    }

    /**
     * Start the flipping process. Find direction and corner of flipping. Creating an object for calculation.
     *
     * @param {Point} globalPos - Touch Point Coordinates (relative window)
     *
     * @returns {boolean} True if flipping is possible, false otherwise
     */
    public start(globalPos: Point): boolean {
        this.reset();

        const bookPos = this.render.convertToBook(globalPos);
        const rect = this.getBoundsRect();

        // Find the direction of flipping
        const direction = this.getDirectionByPoint(bookPos);

        // Find the active corner
        const flipCorner = bookPos.y >= rect.height / 2 ? FlipCorner.BOTTOM : FlipCorner.TOP;

        if (!this.checkDirection(direction)) return false;

        try {
            this.flippingPage = this.app.getPageCollection().getFlippingPage(direction);
            this.bottomPage = this.app.getPageCollection().getBottomPage(direction);

            if (this.flippingPage === null) {
                return false;
            } 

            // In landscape mode, needed to set the density  of the next page to the same as that of the flipped
            if (this.render.getOrientation() === Orientation.LANDSCAPE) {
                if (direction === FlipDirection.BACK) {
                    const nextPage = this.app.getPageCollection().nextBy(this.flippingPage);

                    if (nextPage !== null) {
                        if (this.flippingPage.getDensity() !== nextPage.getDensity()) {
                            this.flippingPage.setDrawingDensity(PageDensity.HARD);
                            nextPage.setDrawingDensity(PageDensity.HARD);
                        }
                    }
                } else {
                    const prevPage = this.app.getPageCollection().prevBy(this.flippingPage);

                    if (prevPage !== null) {
                        if (this.flippingPage.getDensity() !== prevPage.getDensity()) {
                            this.flippingPage.setDrawingDensity(PageDensity.HARD);
                            prevPage.setDrawingDensity(PageDensity.HARD);
                        }
                    }
                }
            }

            this.render.setDirection(direction);
            this.calc = new FlipCalculation(
                direction,
                flipCorner,
                rect.pageWidth.toString(10), // fix bug with type casting
                rect.height.toString(10) // fix bug with type casting
            );

            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Perform calculations for the current page position. Pass data to render object
     *
     * @param {Point} pagePos - Touch Point Coordinates (relative active page)
     */
    private do(pagePos: Point): void {

        if (this.calc === null) return; // Flipping process not started

        if (this.bottomPage === null || this.flippingPage === null) return;

        if (this.calc.calc(pagePos)) {
            // Perform calculations for a specific position
            const progress = this.calc.getFlippingProgress();
            

            this.bottomPage.setArea(this.calc.getBottomClipArea());
            this.bottomPage.setPosition(this.calc.getBottomPagePosition());
            this.bottomPage.setAngle(0);
            this.bottomPage.setHardAngle(0);

            this.flippingPage.setArea(this.calc.getFlippingClipArea());
            this.flippingPage.setPosition(this.calc.getActiveCorner());
            this.flippingPage.setAngle(this.calc.getAngle());

            if (this.calc.getDirection() === FlipDirection.FORWARD) {
                this.flippingPage.setHardAngle((90 * (200 - progress * 2)) / 100);
            } else {
                this.flippingPage.setHardAngle((-90 * (200 - progress * 2)) / 100);
            }

            this.render.setPageRect(this.calc.getRect());

            this.render.setBottomPage(this.bottomPage);
            this.render.setFlippingPage(this.flippingPage);

            let shadowStart:Point | null = this.calc.getShadowStartPoint();
            if (shadowStart === null) {
                return
            }
            this.render.setShadowData(
                shadowStart, 
                this.calc.getShadowAngle(),
                progress,
                this.calc.getDirection()
            );
        }
    }

    /**
     * Turn to the specified page number (with animation)
     *
     * @param {number} page - New page number
     * @param {FlipCorner} corner - Active page corner when turning
     */
    public flipToPage(page: number, corner: FlipCorner): void {
        const current = this.app.getPageCollection().getCurrentSpreadIndex();
        const next = this.app.getPageCollection().getSpreadIndexByPage(page);

        try {
            if (next > current) {
                this.app.getPageCollection().setCurrentSpreadIndex(next - 1);
                this.flipNext(corner);
            }
            if (next < current) {
                this.app.getPageCollection().setCurrentSpreadIndex(next + 1);
                this.flipPrev(corner);
            }
        } catch (e) {
            //
        }
    }

    /**
     * Turn to the next page (with animation)
     *
     * @param {FlipCorner} corner - Active page corner when turning
     */
    public flipNext(corner: FlipCorner): void {
        this.flip({
            x: this.render.getRect().left + this.render.getRect().pageWidth * 2 - 10,
            y: corner === FlipCorner.TOP ? 1 : this.render.getRect().height - 2,
        });
    }

    /**
     * Turn to the prev page (with animation)
     *
     * @param {FlipCorner} corner - Active page corner when turning
     */
    public flipPrev(corner: FlipCorner): void {
        this.flip({
            x: 10,
            y: corner === FlipCorner.TOP ? 1 : this.render.getRect().height - 2,
        });
    }

    /**
     * Called when the user has stopped flipping
     */
    public stopMove(): void {
        if (this.calc === null) return;

        const pos = this.calc.getPosition();
        const rect = this.getBoundsRect();

        const y = this.calc.getCorner() === FlipCorner.BOTTOM ? rect.height : 0;

        if (pos.x <= 0) this.animateFlippingTo(pos, { x: -rect.pageWidth, y }, true);
        else this.animateFlippingTo(pos, { x: rect.pageWidth, y }, false);
    }

    /**
     * Fold the corners of the book when the mouse pointer is over them.
     * Called when the mouse pointer is over the book without clicking
     *
     * @param globalPos
     */
    public showCorner(globalPos: Point): void {

        if (!this.checkState(FlippingState.READ, FlippingState.FOLD_CORNER)) return;

        const rect = this.getBoundsRect();
        const pageWidth = rect.pageWidth;

        if (this.isPointOnCorners(globalPos)) {

            if (this.calc === null) {

                // this.start() builds the this.calc object
                if (!this.start(globalPos)) return;

                this.setState(FlippingState.FOLD_CORNER);

                // calculates intersection points
                // @ts-ignore
                this.calc.calc({ x: pageWidth - 1, y: 1 });

                const fixedCornerSize = 50;
                // @ts-ignore
                const yStart = this.calc.getCorner() === FlipCorner.BOTTOM ? rect.height - 1 : 1;

                const yDest =
                    // @ts-ignore
                    this.calc.getCorner() === FlipCorner.BOTTOM
                        ? rect.height - fixedCornerSize
                        : fixedCornerSize;

                this.animateFlippingTo(
                    { x: pageWidth - 1, y: yStart },
                    { x: pageWidth - fixedCornerSize, y: yDest },
                    false,
                    false
                );
            } else {
                this.do(this.render.convertToPage(globalPos));
            }
        } else {
            this.setState(FlippingState.READ);
            this.render.finishAnimation();

            this.stopMove();
        }
    }

    /**
     * Starting the flipping animation process
     *
     * @param {Point} start - animation start point
     * @param {Point} dest - animation end point
     * @param {boolean} isTurned - will the page turn over, or just bring it back
     * @param {boolean} needReset - reset the flipping process at the end of the animation
     */
    private animateFlippingTo(
        start: Point,
        dest: Point,
        isTurned: boolean,
        needReset = true
    ): void {
        const points = Helper.GetCordsFromTwoPoint(start, dest);

        // Create frames
        const frames = [];
        for (const p of points) frames.push(() => this.do(p));

        const duration = this.getAnimationDuration(points.length);

        this.render.startAnimation(frames, duration, () => {
            // callback function
            if (!this.calc) return;

            if (isTurned) {
                if (this.calc.getDirection() === FlipDirection.BACK) this.app.turnToPrevPage();
                else this.app.turnToNextPage();
            }

            if (needReset) {
                this.render.setBottomPage(null);
                this.render.setFlippingPage(null);
                this.render.clearShadow();

                this.setState(FlippingState.READ);
                this.reset();
            }
        });
    }

    /**
     * Get the current calculations object
     */
    public getCalculation(): FlipCalculation | null {
        return this.calc;
    }

    /**
     * Get current flipping state
     */
    public getState(): FlippingState {
        return this.state;
    }

    private setState(newState: FlippingState): void {
        if (this.state !== newState) {
            this.app.updateState(newState);
            this.state = newState;
        }
    }

    private getDirectionByPoint(touchPos: Point): FlipDirection {
        const rect = this.getBoundsRect();

        if (this.render.getOrientation() === Orientation.PORTRAIT) {
            if (touchPos.x - rect.pageWidth <= rect.width / 5) {
                return FlipDirection.BACK;
            }
        } else if (touchPos.x < rect.width / 2) {
            return FlipDirection.BACK;
        }

        return FlipDirection.FORWARD;
    }

    private getAnimationDuration(size: number): number {
        const defaultTime = this.app.getSettings().flippingTime;

        if (size >= 1000) return defaultTime;

        return (size / 1000) * defaultTime;
    }

    private checkDirection(direction: FlipDirection): boolean {
        if (direction === FlipDirection.FORWARD)
            return this.app.getCurrentPageIndex() < this.app.getPageCount() - 1;

        return this.app.getCurrentPageIndex() >= 1;
    }

    private reset(): void {
        this.calc = null;
        this.flippingPage = null;
        this.bottomPage = null;
    }

    private getBoundsRect(): PageRect {
        return this.render.getRect();
    }

    private checkState(...states: FlippingState[]): boolean {
        for (const state of states) {
            if (this.state === state) return true;
        }

        return false;
    }

    private isPointOnCorners(globalPos: Point): boolean {

        // globalPos:relative to the book

        const rect = this.getBoundsRect();
        const pageWidth = rect.pageWidth;

        let operatingDistance = Math.sqrt(Math.pow(pageWidth, 2) + Math.pow(rect.height, 2)) / 5;
        // added to decrease the operating distance
        operatingDistance = operatingDistance/2.0;
        // console.log('op distance', operatingDistance);

        const bookPos = this.render.convertToBook(globalPos);

        return (
            bookPos.x > 0 &&
            bookPos.y > 0 &&
            bookPos.x < rect.width &&
            bookPos.y < rect.height &&
            (bookPos.x < operatingDistance || bookPos.x > rect.width - operatingDistance) &&
            (bookPos.y < operatingDistance || bookPos.y > rect.height - operatingDistance)
        );
    }

    private isPointOnLeftCorner(globalPos: Point): boolean {

        const rect = this.getBoundsRect();
        const pageWidth = rect.pageWidth;
        let operatingDistance = Math.sqrt(Math.pow(pageWidth, 2) + Math.pow(rect.height, 2)) / 5;
        // operatingDistance = operatingDistance/2.0;
        const bookPos = this.render.convertToBook(globalPos);
        /*
        [  |  ]
        [  |  ]
        [* |  ]
        */
        return (
            bookPos.x > 0 &&
            bookPos.y > 0 &&
            bookPos.x < rect.width &&
            bookPos.y < rect.height &&
            (bookPos.x < operatingDistance) &&
            (bookPos.y < operatingDistance || bookPos.y > rect.height - operatingDistance)
        );
    }
    private isPointOnRightCorner(globalPos: Point): boolean {
        const rect = this.getBoundsRect();
        const pageWidth = rect.pageWidth;
        let operatingDistance = Math.sqrt(Math.pow(pageWidth, 2) + Math.pow(rect.height, 2)) / 5;
        // operatingDistance = operatingDistance/2.0;
        const bookPos = this.render.convertToBook(globalPos);
        /*
        [  |  ]
        [  |  ]
        [  | *]
        */
        return (
            bookPos.x > 0 &&
            bookPos.y > 0 &&
            bookPos.x < rect.width &&
            bookPos.y < rect.height &&
            (bookPos.x > rect.width - operatingDistance) &&
            (bookPos.y < operatingDistance || bookPos.y > rect.height - operatingDistance)
        );
    }
}
