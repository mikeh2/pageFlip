import './Style/stPageFlip.css';

/**
 * Flipping direction
 */
var FlipDirection;
(function (FlipDirection) {
    FlipDirection[FlipDirection["FORWARD"] = 0] = "FORWARD";
    FlipDirection[FlipDirection["BACK"] = 1] = "BACK";
})(FlipDirection || (FlipDirection = {}));
/**
 * Active corner when flipping
 */
var FlipCorner;
(function (FlipCorner) {
    FlipCorner["TOP"] = "top";
    FlipCorner["BOTTOM"] = "bottom";
})(FlipCorner || (FlipCorner = {}));
/**
 * State of the book
 */
var FlippingState;
(function (FlippingState) {
    /** The user folding the page */
    FlippingState["USER_FOLD"] = "user_fold";
    /** Mouse over active corners */
    FlippingState["FOLD_CORNER"] = "fold_corner";
    /** During flipping animation */
    FlippingState["FLIPPING"] = "flipping";
    /** Base state */
    FlippingState["READ"] = "read";
})(FlippingState || (FlippingState = {}));

// Book orientation
var Orientation;
(function (Orientation) {
    Orientation["PORTRAIT"] = "portrait";
    Orientation["LANDSCAPE"] = "landscape";
})(Orientation || (Orientation = {}));
var ClickFlipType;
(function (ClickFlipType) {
    // auto set useMouseEvents = true
    ClickFlipType[ClickFlipType["ANYWHERE_ON_PAGE"] = 1] = "ANYWHERE_ON_PAGE";
    ClickFlipType[ClickFlipType["ONLY_ON_CORNERS"] = 2] = "ONLY_ON_CORNERS";
    // auto set to useMouseEvents = false
    ClickFlipType[ClickFlipType["DISABLE_FLIPPING"] = 3] = "DISABLE_FLIPPING";
    ClickFlipType[ClickFlipType["ONLY_VIA_API"] = 4] = "ONLY_VIA_API";
})(ClickFlipType || (ClickFlipType = {}));
class Settings {
    _default = {
        startPage: 0,
        width: 0,
        height: 0,
        orientation: Orientation.LANDSCAPE,
        drawShadow: true,
        flippingTime: 1000,
        startZIndex: 0,
        maxShadowOpacity: 1,
        showCover: false,
        mobileScrollSupport: true,
        swipeDistance: 30,
        clickEventForward: true,
        showPageCorners: true,
        clickFlipType: ClickFlipType.ANYWHERE_ON_PAGE,
    };
    /**
     * Processing parameters received from the user. Substitution default values
     *
     * @param userSetting
     * @returns {FlipSetting} Сonfiguration object
     */
    getSettings(userSetting) {
        const result = this._default;
        Object.assign(result, userSetting);
        if (result.width <= 0 || result.height <= 0)
            throw new Error('Invalid width or height');
        if (result.flippingTime <= 0)
            throw new Error('Invalid flipping time');
        return result;
    }
}

/**
 * UI Class, represents work with DOM
 */
class UI {
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

/**
 * UI for canvas mode
 */
class CanvasUI extends UI {
    canvas;
    constructor(inBlock, app) {
        super(inBlock, app);
        this.wrapper.innerHTML = '<canvas class="stf__canvas"></canvas>';
        this.canvas = inBlock.querySelectorAll('canvas')[0];
        this.distElement = this.canvas;
        this.resizeCanvas();
        this.setHandlers();
    }
    resizeCanvas() {
        const cs = getComputedStyle(this.canvas);
        const width = parseInt(cs.getPropertyValue('width'), 10);
        const height = parseInt(cs.getPropertyValue('height'), 10);
        this.canvas.width = width;
        this.canvas.height = height;
    }
    /**
     * Get canvas element
     */
    getCanvas() {
        return this.canvas;
    }
    update() {
        this.resizeCanvas();
        this.app.getRender().update();
    }
}

/**
 * UI for HTML mode
 */
class HTMLUI extends UI {
    items;
    constructor(inBlock, app, items) {
        super(inBlock, app);
        // Second wrapper to HTML page
        this.wrapper.insertAdjacentHTML('afterbegin', '<div class="stf__block"></div>');
        this.distElement = inBlock.querySelector('.stf__block');
        this.items = items;
        for (const item of items) {
            this.distElement.appendChild(item);
        }
        this.setHandlers();
    }
    clear() {
        for (const item of this.items) {
            this.parentElement.appendChild(item);
        }
    }
    /**
     * Update page list from HTMLElements
     *
     * @param {(NodeListOf<HTMLElement>|HTMLElement[])} items - List of pages as HTML Element
     */
    updateItems(items) {
        this.removeHandlers();
        this.distElement.innerHTML = '';
        for (const item of items) {
            this.distElement.appendChild(item);
        }
        this.items = items;
        this.setHandlers();
    }
    update() {
        this.app.getRender().update();
    }
}

var PageOrientation;
(function (PageOrientation) {
    /** Left side page */
    PageOrientation[PageOrientation["LEFT"] = 0] = "LEFT";
    /** Right side page */
    PageOrientation[PageOrientation["RIGHT"] = 1] = "RIGHT";
})(PageOrientation || (PageOrientation = {}));
var PageDensity;
(function (PageDensity) {
    PageDensity["SOFT"] = "soft";
    PageDensity["HARD"] = "hard";
})(PageDensity || (PageDensity = {}));
/**
 * Class representing a book page
 */
class Page {
    /** State of the page on the basis of which rendering */
    state;
    /** Render object */
    render;
    /** Page Orientation */
    orientation = PageOrientation.RIGHT;
    /** Density at creation */
    createdDensity;
    /** Density at the time of rendering (Depends on neighboring pages) */
    nowDrawingDensity;
    constructor(render, density) {
        this.state = {
            angle: 0,
            area: [],
            position: { x: 0, y: 0 },
            hardAngle: 0,
            hardDrawingAngle: 0,
        };
        this.createdDensity = density;
        this.nowDrawingDensity = this.createdDensity;
        this.render = render;
    }
    /**
     * Set a constant page density
     *
     * @param {PageDensity} density
     */
    setDensity(density) {
        this.createdDensity = density;
        this.nowDrawingDensity = density;
    }
    /**
     * Set temp page density to next render
     *
     * @param {PageDensity}  density
     */
    setDrawingDensity(density) {
        this.nowDrawingDensity = density;
    }
    /**
     * Set page position
     *
     * @param {Point} pagePos
     */
    setPosition(pagePos) {
        this.state.position = pagePos;
    }
    /**
     * Set page angle
     *
     * @param {number} angle
     */
    setAngle(angle) {
        this.state.angle = angle;
    }
    /**
     * Set page crop area
     *
     * @param {Point[]} area
     */
    setArea(area) {
        this.state.area = area;
    }
    /**
     * Rotate angle for hard pages to next render
     *
     * @param {number} angle
     */
    setHardDrawingAngle(angle) {
        this.state.hardDrawingAngle = angle;
    }
    /**
     * Rotate angle for hard pages
     *
     * @param {number} angle
     */
    setHardAngle(angle) {
        this.state.hardAngle = angle;
        this.state.hardDrawingAngle = angle;
    }
    /**
     * Set page orientation
     *
     * @param {PageOrientation} orientation
     */
    setOrientation(orientation) {
        this.orientation = orientation;
    }
    /**
     * Get temp page density
     */
    getDrawingDensity() {
        return this.nowDrawingDensity;
    }
    /**
     * Get a constant page density
     */
    getDensity() {
        return this.createdDensity;
    }
    /**
     * Get rotate angle for hard pages
     */
    getHardAngle() {
        return this.state.hardAngle;
    }
}

/**
 * Class representing a book page as an image on Canvas
 */
class ImagePage extends Page {
    image = null;
    isLoad = false;
    loadingAngle = 0;
    constructor(render, href, density) {
        super(render, density);
        this.image = new Image();
        this.image.src = href;
    }
    draw(tempDensity) {
        const ctx = this.render.getContext();
        const pagePos = this.render.convertToGlobal(this.state.position);
        const pageWidth = this.render.getRect().pageWidth;
        const pageHeight = this.render.getRect().height;
        ctx.save();
        ctx.translate(pagePos.x, pagePos.y);
        ctx.beginPath();
        for (let p of this.state.area) {
            if (p !== null) {
                p = this.render.convertToGlobal(p);
                ctx.lineTo(p.x - pagePos.x, p.y - pagePos.y);
            }
        }
        ctx.rotate(this.state.angle);
        ctx.clip();
        if (!this.isLoad) {
            this.drawLoader(ctx, { x: 0, y: 0 }, pageWidth, pageHeight);
        }
        else {
            ctx.drawImage(this.image, 0, 0, pageWidth, pageHeight);
        }
        ctx.restore();
    }
    simpleDraw(orient) {
        const rect = this.render.getRect();
        const ctx = this.render.getContext();
        const pageWidth = rect.pageWidth;
        const pageHeight = rect.height;
        const x = orient === PageOrientation.RIGHT ? rect.left + rect.pageWidth : rect.left;
        const y = rect.top;
        if (!this.isLoad) {
            this.drawLoader(ctx, { x, y }, pageWidth, pageHeight);
        }
        else {
            ctx.drawImage(this.image, x, y, pageWidth, pageHeight);
        }
    }
    drawLoader(ctx, shiftPos, pageWidth, pageHeight) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgb(200, 200, 200)';
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.lineWidth = 1;
        ctx.rect(shiftPos.x + 1, shiftPos.y + 1, pageWidth - 1, pageHeight - 1);
        ctx.stroke();
        ctx.fill();
        const middlePoint = {
            x: shiftPos.x + pageWidth / 2,
            y: shiftPos.y + pageHeight / 2,
        };
        ctx.beginPath();
        ctx.lineWidth = 10;
        ctx.arc(middlePoint.x, middlePoint.y, 20, this.loadingAngle, (3 * Math.PI) / 2 + this.loadingAngle);
        ctx.stroke();
        ctx.closePath();
        this.loadingAngle += 0.07;
        if (this.loadingAngle >= 2 * Math.PI) {
            this.loadingAngle = 0;
        }
    }
    load() {
        if (!this.isLoad)
            this.image.onload = () => {
                this.isLoad = true;
            };
    }
    newTemporaryCopy() {
        return this;
    }
    getTemporaryCopy() {
        return this;
    }
    hideTemporaryCopy() {
        return;
    }
}

/**
 * A class containing helping mathematical methods
 */
class Helper {
    /**
     * Get the distance between two points
     *
     * @param {Point} point1
     * @param {Point} point2
     */
    static GetDistanceBetweenTwoPoint(point1, point2) {
        if (point1 === null || point2 === null) {
            return Infinity;
        }
        return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    }
    /**
     * Get the length of the line segment
     *
     * @param {Segment} segment
     */
    static GetSegmentLength(segment) {
        return Helper.GetDistanceBetweenTwoPoint(segment[0], segment[1]);
    }
    /**
     * Get the angle between two lines
     *
     * @param {Segment} line1
     * @param {Segment} line2
     */
    static GetAngleBetweenTwoLine(line1, line2) {
        const A1 = line1[0].y - line1[1].y;
        const A2 = line2[0].y - line2[1].y;
        const B1 = line1[1].x - line1[0].x;
        const B2 = line2[1].x - line2[0].x;
        return Math.acos((A1 * A2 + B1 * B2) / (Math.sqrt(A1 * A1 + B1 * B1) * Math.sqrt(A2 * A2 + B2 * B2)));
    }
    /**
     * Check for a point in a rectangle
     *
     * @param {Rect} rect
     * @param {Point} pos
     *
     * @returns {Point} If the point enters the rectangle its coordinates will be returned, otherwise - null
     */
    static PointInRect(rect, pos) {
        if (pos === null) {
            return null;
        }
        if (pos.x >= rect.left &&
            pos.x <= rect.width + rect.left &&
            pos.y >= rect.top &&
            pos.y <= rect.top + rect.height) {
            return pos;
        }
        return null;
    }
    /**
     * Transform point coordinates to a given angle
     *
     * @param {Point} transformedPoint - Point to rotate
     * @param {Point} startPoint - Transformation reference point
     * @param {number} angle - Rotation angle (in radians)
     *
     * @returns {Point} Point coordinates after rotation
     */
    static GetRotatedPoint(transformedPoint, startPoint, angle) {
        return {
            x: transformedPoint.x * Math.cos(angle) + transformedPoint.y * Math.sin(angle) + startPoint.x,
            y: transformedPoint.y * Math.cos(angle) - transformedPoint.x * Math.sin(angle) + startPoint.y,
        };
    }
    /**
     * Limit a point "linePoint" to a given circle centered at point "startPoint" and a given radius
     *
     * @param {Point} startPoint - Circle center
     * @param {number} radius - Circle radius
     * @param {Point} limitedPoint - Сhecked point
     *
     * @returns {Point} If "linePoint" enters the circle, then its coordinates are returned.
     * Else will be returned the intersection point between the line ([startPoint, linePoint]) and the circle
     */
    static LimitPointToCircle(startPoint, radius, limitedPoint) {
        // If "linePoint" enters the circle, do nothing
        if (Helper.GetDistanceBetweenTwoPoint(startPoint, limitedPoint) <= radius) {
            return limitedPoint;
        }
        const a = startPoint.x;
        const b = startPoint.y;
        const n = limitedPoint.x;
        const m = limitedPoint.y;
        // Find the intersection between the line at two points: (startPoint and limitedPoint) and the circle.
        let x = Math.sqrt((Math.pow(radius, 2) * Math.pow(a - n, 2)) / (Math.pow(a - n, 2) + Math.pow(b - m, 2))) + a;
        if (limitedPoint.x < 0) {
            x *= -1;
        }
        let y = ((x - a) * (b - m)) / (a - n) + b;
        if (a - n + b === 0) {
            y = radius;
        }
        return { x, y };
    }
    /**
     * Find the intersection of two lines bounded by a rectangle "rectBorder"
     *
     * @param {Rect} rectBorder
     * @param {Segment} one
     * @param {Segment} two
     *
     * @returns {Point} The intersection point, or "null" if it does not exist, or it lies outside the rectangle "rectBorder"
     */
    static GetIntersectBetweenTwoSegment(rectBorder, one, two) {
        return Helper.PointInRect(rectBorder, Helper.GetIntersectBeetwenTwoLine(one, two));
    }
    /**
     * Find the intersection point of two lines
     *
     * @param one
     * @param two
     *
     * @returns {Point} The intersection point, or "null" if it does not exist
     * @throws Error if the segments are on the same line
     */
    static GetIntersectBeetwenTwoLine(one, two) {
        const A1 = one[0].y - one[1].y;
        const A2 = two[0].y - two[1].y;
        const B1 = one[1].x - one[0].x;
        const B2 = two[1].x - two[0].x;
        const C1 = one[0].x * one[1].y - one[1].x * one[0].y;
        const C2 = two[0].x * two[1].y - two[1].x * two[0].y;
        const det1 = A1 * C2 - A2 * C1;
        const det2 = B1 * C2 - B2 * C1;
        const x = -((C1 * B2 - C2 * B1) / (A1 * B2 - A2 * B1));
        const y = -((A1 * C2 - A2 * C1) / (A1 * B2 - A2 * B1));
        if (isFinite(x) && isFinite(y)) {
            return { x, y };
        }
        else {
            if (Math.abs(det1 - det2) < 0.1)
                throw new Error('Segment included');
        }
        return null;
    }
    /**
     * Get a list of coordinates (step: 1px) between two points
     *
     * @param pointOne
     * @param pointTwo
     *
     * @returns {Point[]}
     */
    static GetCordsFromTwoPoint(pointOne, pointTwo) {
        const sizeX = Math.abs(pointOne.x - pointTwo.x);
        const sizeY = Math.abs(pointOne.y - pointTwo.y);
        const lengthLine = Math.max(sizeX, sizeY);
        const result = [pointOne];
        function getCord(c1, c2, size, length, index) {
            if (c2 > c1) {
                return c1 + index * (size / length);
            }
            else if (c2 < c1) {
                return c1 - index * (size / length);
            }
            return c1;
        }
        for (let i = 1; i <= lengthLine; i += 1) {
            result.push({
                x: getCord(pointOne.x, pointTwo.x, sizeX, lengthLine, i),
                y: getCord(pointOne.y, pointTwo.y, sizeY, lengthLine, i),
            });
        }
        return result;
    }
}

/**
 * Class representing a book page as a HTML Element
 */
class HTMLPage extends Page {
    element;
    copiedElement = null;
    temporaryCopy = null;
    isLoad = false;
    constructor(render, element, density) {
        super(render, density);
        this.element = element;
        this.element.classList.add('stf__item');
        this.element.classList.add('__' + density);
    }
    newTemporaryCopy() {
        if (this.nowDrawingDensity === PageDensity.HARD) {
            return this;
        }
        if (this.temporaryCopy === null) {
            this.copiedElement = this.element.cloneNode(true);
            this.element.parentElement.appendChild(this.copiedElement);
            this.temporaryCopy = new HTMLPage(this.render, this.copiedElement, this.nowDrawingDensity);
        }
        return this.getTemporaryCopy();
    }
    getTemporaryCopy() {
        return this.temporaryCopy;
    }
    hideTemporaryCopy() {
        if (this.temporaryCopy !== null) {
            this.copiedElement.remove();
            this.copiedElement = null;
            this.temporaryCopy = null;
        }
    }
    draw(tempDensity) {
        const density = tempDensity ? tempDensity : this.nowDrawingDensity;
        const pagePos = this.render.convertToGlobal(this.state.position);
        const pageWidth = this.render.getRect().pageWidth;
        const pageHeight = this.render.getRect().height;
        this.element.classList.remove('__simple');
        const commonStyle = `
            display: block;
            z-index: ${this.element.style.zIndex};
            left: 0;
            top: 0;
            width: ${pageWidth}px;
            height: ${pageHeight}px;
        `;
        density === PageDensity.HARD
            ? this.drawHard(commonStyle)
            : this.drawSoft(pagePos, commonStyle);
    }
    drawHard(commonStyle = '') {
        const pos = this.render.getRect().left + this.render.getRect().width / 2;
        const angle = this.state.hardDrawingAngle;
        const newStyle = commonStyle +
            `
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                clip-path: none;
                -webkit-clip-path: none;
            ` +
            (this.orientation === PageOrientation.LEFT
                ? `transform-origin: ${this.render.getRect().pageWidth}px 0; 
                   transform: translate3d(0, 0, 0) rotateY(${angle}deg);`
                : `transform-origin: 0 0; 
                   transform: translate3d(${pos}px, 0, 0) rotateY(${angle}deg);`);
        this.element.style.cssText = newStyle;
    }
    drawSoft(position, commonStyle = '') {
        let polygon = 'polygon( ';
        for (const p of this.state.area) {
            if (p !== null) {
                let g = this.render.getDirection() === FlipDirection.BACK
                    ? {
                        x: -p.x + this.state.position.x,
                        y: p.y - this.state.position.y,
                    }
                    : {
                        x: p.x - this.state.position.x,
                        y: p.y - this.state.position.y,
                    };
                g = Helper.GetRotatedPoint(g, { x: 0, y: 0 }, this.state.angle);
                polygon += g.x + 'px ' + g.y + 'px, ';
            }
        }
        polygon = polygon.slice(0, -2);
        polygon += ')';
        const newStyle = commonStyle +
            `transform-origin: 0 0; clip-path: ${polygon}; -webkit-clip-path: ${polygon};` +
            (this.render.isSafari() && this.state.angle === 0
                ? `transform: translate(${position.x}px, ${position.y}px);`
                : `transform: translate3d(${position.x}px, ${position.y}px, 0) rotate(${this.state.angle}rad);`);
        this.element.style.cssText = newStyle;
    }
    simpleDraw(orient) {
        const rect = this.render.getRect();
        const pageWidth = rect.pageWidth;
        const pageHeight = rect.height;
        const x = orient === PageOrientation.RIGHT ? rect.left + rect.pageWidth : rect.left;
        const y = rect.top;
        this.element.classList.add('__simple');
        this.element.style.cssText = `
            position: absolute; 
            display: block; 
            height: ${pageHeight}px; 
            left: ${x}px; 
            top: ${y}px; 
            width: ${pageWidth}px; 
            z-index: ${this.render.getSettings().startZIndex + 1};`;
    }
    getElement() {
        return this.element;
    }
    load() {
        this.isLoad = true;
    }
    setOrientation(orientation) {
        super.setOrientation(orientation);
        this.element.classList.remove('__left', '__right');
        this.element.classList.add(orientation === PageOrientation.RIGHT ? '__right' : '__left');
    }
    setDrawingDensity(density) {
        this.element.classList.remove('__soft', '__hard');
        this.element.classList.add('__' + density);
        super.setDrawingDensity(density);
    }
}

/**
 * Сlass representing a collection of pages
 */
class PageCollection {
    app;
    render;
    isShowCover;
    /** Pages List */
    pages = [];
    /** Index of the current page in list */
    currentPageIndex = 0;
    /** Number of the current spread in book */
    currentSpreadIndex = 0;
    /**  Two-page spread in landscape mode */
    landscapeSpread = [];
    /**  One-page spread in portrait mode */
    portraitSpread = [];
    constructor(app, render) {
        this.render = render;
        this.app = app;
        this.currentPageIndex = 0;
        this.isShowCover = this.app.getSettings().showCover;
    }
    /**
     * Clear pages list
     */
    destroy() {
        this.pages = [];
    }
    /**
     * Split the book on the two-page spread in landscape mode and one-page spread in portrait mode
     */
    createSpread() {
        this.landscapeSpread = [];
        this.portraitSpread = [];
        for (let i = 0; i < this.pages.length; i++) {
            this.portraitSpread.push([i]); // In portrait mode - (one spread = one page)
        }
        let start = 0;
        if (this.isShowCover) {
            this.pages[0].setDensity(PageDensity.HARD);
            this.landscapeSpread.push([start]);
            start++;
        }
        for (let i = start; i < this.pages.length; i += 2) {
            if (i < this.pages.length - 1)
                this.landscapeSpread.push([i, i + 1]);
            else {
                this.landscapeSpread.push([i]);
                this.pages[i].setDensity(PageDensity.HARD);
            }
        }
    }
    /**
     * Get spread by mode (portrait or landscape)
     */
    getSpread() {
        return this.render.getOrientation() === Orientation.LANDSCAPE
            ? this.landscapeSpread
            : this.portraitSpread;
    }
    /**
     * Get spread index by page number
     *
     * @param {number} pageNum - page index
     */
    getSpreadIndexByPage(pageNum) {
        const spread = this.getSpread();
        for (let i = 0; i < spread.length; i++)
            if (pageNum === spread[i][0] || pageNum === spread[i][1])
                return i;
        return null;
    }
    /**
     * Get the total number of pages
     */
    getPageCount() {
        return this.pages.length;
    }
    /**
     * Get the pages list
     */
    getPages() {
        return this.pages;
    }
    /**
     * Get page by index
     *
     * @param {number} pageIndex
     */
    getPage(pageIndex) {
        if (pageIndex >= 0 && pageIndex < this.pages.length) {
            return this.pages[pageIndex];
        }
        throw new Error('Invalid page number');
    }
    /**
     * Get the next page from the specified
     *
     * @param {Page} current
     */
    nextBy(current) {
        const idx = this.pages.indexOf(current);
        if (idx < this.pages.length - 1)
            return this.pages[idx + 1];
        return null;
    }
    /**
     * Get previous page from specified
     *
     * @param {Page} current
     */
    prevBy(current) {
        const idx = this.pages.indexOf(current);
        if (idx > 0)
            return this.pages[idx - 1];
        return null;
    }
    /**
     * Get flipping page depending on the direction
     *
     * @param {FlipDirection} direction
     */
    getFlippingPage(direction) {
        const current = this.currentSpreadIndex;
        if (this.render.getOrientation() === Orientation.PORTRAIT) {
            return direction === FlipDirection.FORWARD
                ? this.pages[current].newTemporaryCopy()
                : this.pages[current - 1];
        }
        else {
            const spread = direction === FlipDirection.FORWARD
                ? this.getSpread()[current + 1]
                : this.getSpread()[current - 1];
            if (spread.length === 1)
                return this.pages[spread[0]];
            return direction === FlipDirection.FORWARD
                ? this.pages[spread[0]]
                : this.pages[spread[1]];
        }
    }
    /**
     * Get Next page at the time of flipping
     *
     * @param {FlipDirection}  direction
     */
    getBottomPage(direction) {
        const current = this.currentSpreadIndex;
        if (this.render.getOrientation() === Orientation.PORTRAIT) {
            return direction === FlipDirection.FORWARD
                ? this.pages[current + 1]
                : this.pages[current - 1];
        }
        else {
            const spread = direction === FlipDirection.FORWARD
                ? this.getSpread()[current + 1]
                : this.getSpread()[current - 1];
            if (spread.length === 1)
                return this.pages[spread[0]];
            return direction === FlipDirection.FORWARD
                ? this.pages[spread[1]]
                : this.pages[spread[0]];
        }
    }
    /**
     * Show next spread
     */
    showNext() {
        if (this.currentSpreadIndex < this.getSpread().length) {
            this.currentSpreadIndex++;
            this.showSpread();
        }
    }
    /**
     * Show prev spread
     */
    showPrev() {
        if (this.currentSpreadIndex > 0) {
            this.currentSpreadIndex--;
            this.showSpread();
        }
    }
    /**
     * Get the number of the current spread in book
     */
    getCurrentPageIndex() {
        return this.currentPageIndex;
    }
    /**
     * Show specified page
     * @param {number} pageNum - Page index (from 0s)
     */
    show(pageNum = null) {
        if (pageNum === null)
            pageNum = this.currentPageIndex;
        if (pageNum < 0 || pageNum >= this.pages.length)
            return;
        const spreadIndex = this.getSpreadIndexByPage(pageNum);
        if (spreadIndex !== null) {
            this.currentSpreadIndex = spreadIndex;
            this.showSpread();
        }
    }
    /**
     * Index of the current page in list
     */
    getCurrentSpreadIndex() {
        return this.currentSpreadIndex;
    }
    /**
     * Set new spread index as current
     *
     * @param {number} newIndex - new spread index
     */
    setCurrentSpreadIndex(newIndex) {
        if (newIndex >= 0 && newIndex < this.getSpread().length) {
            this.currentSpreadIndex = newIndex;
        }
        else {
            throw new Error('Invalid page');
        }
    }
    /**
     * Show current spread
     */
    showSpread() {
        const spread = this.getSpread()[this.currentSpreadIndex];
        if (spread.length === 2) {
            this.render.setLeftPage(this.pages[spread[0]]);
            this.render.setRightPage(this.pages[spread[1]]);
        }
        else {
            if (this.render.getOrientation() === Orientation.LANDSCAPE) {
                if (spread[0] === this.pages.length - 1) {
                    this.render.setLeftPage(this.pages[spread[0]]);
                    this.render.setRightPage(null);
                }
                else {
                    this.render.setLeftPage(null);
                    this.render.setRightPage(this.pages[spread[0]]);
                }
            }
            else {
                this.render.setLeftPage(null);
                this.render.setRightPage(this.pages[spread[0]]);
            }
        }
        this.currentPageIndex = spread[0];
        this.app.updatePageIndex(this.currentPageIndex);
    }
}

/**
 * Сlass representing a collection of pages as HTML Element
 */
class HTMLPageCollection extends PageCollection {
    element;
    pagesElement;
    constructor(app, render, element, items) {
        super(app, render);
        this.element = element;
        this.pagesElement = items;
    }
    load() {
        for (const pageElement of this.pagesElement) {
            const page = new HTMLPage(this.render, pageElement, pageElement.dataset['density'] === 'hard' ? PageDensity.HARD : PageDensity.SOFT);
            page.load();
            this.pages.push(page);
        }
        this.createSpread();
    }
}

/**
 * Сlass representing a collection of pages as images on the canvas
 */
class ImagePageCollection extends PageCollection {
    imagesHref;
    constructor(app, render, imagesHref) {
        super(app, render);
        this.imagesHref = imagesHref;
    }
    load() {
        for (const href of this.imagesHref) {
            const page = new ImagePage(this.render, href, PageDensity.SOFT);
            page.load();
            this.pages.push(page);
        }
        this.createSpread();
    }
}

/**
 * Class responsible for rendering the book
 */
class Render {
    app;
    /** Left static book page */
    leftPage = null;
    /** Right static book page */
    rightPage = null;
    /** Page currently flipping */
    flippingPage = null;
    /** Next page at the time of flipping */
    bottomPage = null;
    /** Current flipping direction */
    direction = null;
    /** Current book orientation */
    orientation = null;
    /** Сurrent state of the shadows */
    shadow = null;
    /** Сurrent animation process */
    animation = null;
    /** Page borders while flipping */
    pageRect = null;
    /** Current book area */
    boundsRect = null;
    /** Timer started from start of rendering */
    timer = 0;
    /**
     * Safari browser definitions for resolving a bug with a css property clip-area
     *
     * https://bugs.webkit.org/show_bug.cgi?id=126207
     */
    safari = false;
    constructor(app) {
        this.app = app;
        // detect safari
        const regex = new RegExp('Version\\/[\\d\\.]+.*Safari/');
        this.safari = regex.exec(window.navigator.userAgent) !== null;
    }
    /**
     * Executed when requestAnimationFrame is called. Performs the current animation process and call drawFrame()
     *
     * @param timer
     */
    render(timer) {
        if (this.animation !== null) {
            // Find current frame of animation
            const frameIndex = Math.round((timer - this.animation.startedAt) / this.animation.durationFrame);
            if (frameIndex < this.animation.frames.length) {
                this.animation.frames[frameIndex]();
            }
            else {
                this.animation.onAnimateEnd();
                this.animation = null;
            }
        }
        this.timer = timer;
        this.drawFrame();
    }
    /**
     * Running requestAnimationFrame, and rendering process
     */
    start() {
        this.update();
        const loop = (timer) => {
            this.render(timer);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
    /**
     * Start a new animation process
     *
     * @param {FrameAction[]} frames - Frame list
     * @param {number} duration - total animation duration
     * @param {AnimationSuccessAction} onAnimateEnd - Animation callback function
     */
    startAnimation(frames, duration, onAnimateEnd) {
        this.finishAnimation(); // finish the previous animation process
        this.animation = {
            frames,
            duration,
            durationFrame: duration / frames.length,
            onAnimateEnd,
            startedAt: this.timer,
        };
    }
    /**
     * End the current animation process and call the callback
     */
    finishAnimation() {
        if (this.animation !== null) {
            this.animation.frames[this.animation.frames.length - 1]();
            if (this.animation.onAnimateEnd !== null) {
                this.animation.onAnimateEnd();
            }
        }
        this.animation = null;
    }
    /**
     * Recalculate the size of the displayed area, and update the page orientation
     */
    update() {
        this.boundsRect = null;
        const orientation = this.calculateBoundsRect();
        if (this.orientation !== orientation) {
            this.orientation = orientation;
            this.app.updateOrientation(orientation);
        }
    }
    /**
     * Calculate the size and position of the book depending on the parent element and configuration parameters
     */
    calculateBoundsRect() {
        // parent element (stf__block)
        this.app.getUI().getDistElement();
        const blockWidth = this.getBlockWidth();
        this.getBlockHeight();
        const middlePoint = {
            x: blockWidth / 2};
        // effect-wise, a 0 margin is best
        let margin = 0;
        let w = this.app.getSettings().width;
        let h = this.app.getSettings().height;
        // portrait mode
        // this is needed for offscreen rendering
        let canvas_width = w * 2;
        let orientation = this.app.getSettings().orientation;
        let pw = w - margin * 2;
        let left = -w + margin * 2;
        if (orientation === Orientation.LANDSCAPE) {
            pw = w / 2 - margin * 2;
            left = margin * 2;
            canvas_width = w;
        }
        else {
            left = middlePoint.x - pw / 2 - pw;
        }
        this.boundsRect = {
            left: left,
            top: margin,
            width: canvas_width,
            height: h - margin * 2,
            pageWidth: pw,
        };
        return orientation;
    }
    /**
     * Set the current parameters of the drop shadow
     *
     * @param {Point} pos - Shadow Position Start Point
     * @param {number} angle - The angle of the shadows relative to the book
     * @param {number} progress - Flipping progress in percent (0 - 100)
     * @param {FlipDirection} direction - Flipping Direction, the direction of the shadow gradients
     */
    setShadowData(pos, angle, progress, direction) {
        if (!this.app.getSettings().drawShadow)
            return;
        const maxShadowOpacity = 100 * this.getSettings().maxShadowOpacity;
        this.shadow = {
            pos,
            angle,
            width: (((this.getRect().pageWidth * 3) / 4) * progress) / 100,
            opacity: ((100 - progress) * maxShadowOpacity) / 100 / 100,
            direction,
            progress: progress * 2,
        };
    }
    /**
     * Clear shadow
     */
    clearShadow() {
        this.shadow = null;
    }
    /**
     * Get parent block offset width
     */
    getBlockWidth() {
        return this.app.getUI().getDistElement().offsetWidth;
    }
    /**
     * Get parent block offset height
     */
    getBlockHeight() {
        return this.app.getUI().getDistElement().offsetHeight;
    }
    /**
     * Get current flipping direction
     */
    getDirection() {
        return this.direction;
    }
    /**
     * Сurrent size and position of the book
     */
    getRect() {
        if (this.boundsRect === null)
            this.calculateBoundsRect();
        return this.boundsRect;
    }
    /**
     * Get configuration object
     */
    getSettings() {
        return this.app.getSettings();
    }
    /**
     * Get current book orientation
     */
    getOrientation() {
        return this.orientation;
    }
    /**
     * Set page area while flipping
     *
     * @param direction
     */
    setPageRect(pageRect) {
        this.pageRect = pageRect;
    }
    /**
     * Set flipping direction
     *
     * @param direction
     */
    setDirection(direction) {
        this.direction = direction;
    }
    /**
     * Set right static book page
     *
     * @param page
     */
    setRightPage(page) {
        if (page !== null)
            page.setOrientation(PageOrientation.RIGHT);
        this.rightPage = page;
    }
    /**
     * Set left static book page
     * @param page
     */
    setLeftPage(page) {
        if (page !== null)
            page.setOrientation(PageOrientation.LEFT);
        this.leftPage = page;
    }
    /**
     * Set next page at the time of flipping
     * @param page
     */
    setBottomPage(page) {
        if (page !== null)
            page.setOrientation(this.direction === FlipDirection.BACK ? PageOrientation.LEFT : PageOrientation.RIGHT);
        this.bottomPage = page;
    }
    /**
     * Set currently flipping page
     *
     * @param page
     */
    setFlippingPage(page) {
        if (page !== null)
            page.setOrientation(this.direction === FlipDirection.FORWARD &&
                this.orientation !== Orientation.PORTRAIT
                ? PageOrientation.LEFT
                : PageOrientation.RIGHT);
        this.flippingPage = page;
    }
    /**
     * Coordinate conversion function. Window coordinates -> to book coordinates
     *
     * @param {Point} pos - Global coordinates relative to the window
     * @returns {Point} Coordinates relative to the book
     */
    convertToBook(pos) {
        const rect = this.getRect();
        return {
            x: pos.x - rect.left,
            y: pos.y - rect.top,
        };
    }
    isSafari() {
        return this.safari;
    }
    /**
     * Coordinate conversion function. Window coordinates -> to current coordinates of the working page
     *
     * @param {Point} pos - Global coordinates relative to the window
     * @param {FlipDirection} direction  - Current flipping direction
     *
     * @returns {Point} Coordinates relative to the work page
     */
    convertToPage(pos, direction) {
        if (!direction)
            direction = this.direction;
        const rect = this.getRect();
        const x = direction === FlipDirection.FORWARD
            ? pos.x - rect.left - rect.width / 2
            : rect.width / 2 - pos.x + rect.left;
        return {
            x,
            y: pos.y - rect.top,
        };
    }
    /**
     * Coordinate conversion function. Coordinates relative to the work page -> Window coordinates
     *
     * @param {Point} pos - Coordinates relative to the work page
     * @param {FlipDirection} direction  - Current flipping direction
     *
     * @returns {Point} Global coordinates relative to the window
     */
    convertToGlobal(pos, direction) {
        if (!direction)
            direction = this.direction;
        if (pos == null)
            return null;
        const rect = this.getRect();
        const x = direction === FlipDirection.FORWARD
            ? pos.x + rect.left + rect.width / 2
            : rect.width / 2 - pos.x + rect.left;
        return {
            x,
            y: pos.y + rect.top,
        };
    }
    /**
     * Casting the coordinates of the corners of the rectangle in the coordinates relative to the window
     *
     * @param {RectPoints} rect - Coordinates of the corners of the rectangle relative to the work page
     * @param {FlipDirection} direction  - Current flipping direction
     *
     * @returns {RectPoints} Coordinates of the corners of the rectangle relative to the window
     */
    convertRectToGlobal(rect, direction) {
        if (!direction)
            direction = this.direction;
        return {
            topLeft: this.convertToGlobal(rect.topLeft, direction),
            topRight: this.convertToGlobal(rect.topRight, direction),
            bottomLeft: this.convertToGlobal(rect.bottomLeft, direction),
            bottomRight: this.convertToGlobal(rect.bottomRight, direction),
        };
    }
}

/**
 * Class responsible for rendering the Canvas book
 */
class CanvasRender extends Render {
    canvas;
    ctx;
    constructor(app, inCanvas) {
        super(app);
        this.canvas = inCanvas;
        this.ctx = inCanvas.getContext('2d');
        console.log('CanvasRender constructor', this.canvas, this.ctx);
    }
    getContext() {
        return this.ctx;
    }
    reload() {
        //
    }
    drawFrame() {
        this.clear();
        if (this.orientation !== Orientation.PORTRAIT)
            if (this.leftPage != null)
                this.leftPage.simpleDraw(PageOrientation.LEFT);
        if (this.rightPage != null)
            this.rightPage.simpleDraw(PageOrientation.RIGHT);
        if (this.bottomPage != null)
            this.bottomPage.draw();
        this.drawBookShadow();
        if (this.flippingPage != null)
            this.flippingPage.draw();
        if (this.shadow != null) {
            this.drawOuterShadow();
            this.drawInnerShadow();
        }
        const rect = this.getRect();
        if (this.orientation === Orientation.PORTRAIT) {
            this.ctx.beginPath();
            this.ctx.rect(rect.left + rect.pageWidth, rect.top, rect.width, rect.height);
            this.ctx.clip();
        }
    }
    drawBookShadow() {
        const rect = this.getRect();
        this.ctx.save();
        this.ctx.beginPath();
        const shadowSize = rect.width / 20;
        this.ctx.rect(rect.left, rect.top, rect.width, rect.height);
        const shadowPos = { x: rect.left + rect.width / 2 - shadowSize / 2, y: 0 };
        this.ctx.translate(shadowPos.x, shadowPos.y);
        const outerGradient = this.ctx.createLinearGradient(0, 0, shadowSize, 0);
        outerGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        outerGradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.2)');
        outerGradient.addColorStop(0.49, 'rgba(0, 0, 0, 0.1)');
        outerGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
        outerGradient.addColorStop(0.51, 'rgba(0, 0, 0, 0.4)');
        outerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.clip();
        this.ctx.fillStyle = outerGradient;
        this.ctx.fillRect(0, 0, shadowSize, rect.height * 2);
        this.ctx.restore();
    }
    drawOuterShadow() {
        const rect = this.getRect();
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(rect.left, rect.top, rect.width, rect.height);
        const shadowPos = this.convertToGlobal({ x: this.shadow.pos.x, y: this.shadow.pos.y });
        this.ctx.translate(shadowPos.x, shadowPos.y);
        this.ctx.rotate(Math.PI + this.shadow.angle + Math.PI / 2);
        const outerGradient = this.ctx.createLinearGradient(0, 0, this.shadow.width, 0);
        if (this.shadow.direction === FlipDirection.FORWARD) {
            this.ctx.translate(0, -100);
            outerGradient.addColorStop(0, 'rgba(0, 0, 0, ' + this.shadow.opacity + ')');
            outerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }
        else {
            this.ctx.translate(-this.shadow.width, -100);
            outerGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            outerGradient.addColorStop(1, 'rgba(0, 0, 0, ' + this.shadow.opacity + ')');
        }
        this.ctx.clip();
        this.ctx.fillStyle = outerGradient;
        this.ctx.fillRect(0, 0, this.shadow.width, rect.height * 2);
        this.ctx.restore();
    }
    drawInnerShadow() {
        const rect = this.getRect();
        this.ctx.save();
        this.ctx.beginPath();
        const shadowPos = this.convertToGlobal({ x: this.shadow.pos.x, y: this.shadow.pos.y });
        const pageRect = this.convertRectToGlobal(this.pageRect);
        this.ctx.moveTo(pageRect.topLeft.x, pageRect.topLeft.y);
        this.ctx.lineTo(pageRect.topRight.x, pageRect.topRight.y);
        this.ctx.lineTo(pageRect.bottomRight.x, pageRect.bottomRight.y);
        this.ctx.lineTo(pageRect.bottomLeft.x, pageRect.bottomLeft.y);
        this.ctx.translate(shadowPos.x, shadowPos.y);
        this.ctx.rotate(Math.PI + this.shadow.angle + Math.PI / 2);
        const isw = (this.shadow.width * 3) / 4;
        const innerGradient = this.ctx.createLinearGradient(0, 0, isw, 0);
        if (this.shadow.direction === FlipDirection.FORWARD) {
            this.ctx.translate(-isw, -100);
            innerGradient.addColorStop(1, 'rgba(0, 0, 0, ' + this.shadow.opacity + ')');
            innerGradient.addColorStop(0.9, 'rgba(0, 0, 0, 0.05)');
            innerGradient.addColorStop(0.7, 'rgba(0, 0, 0, ' + this.shadow.opacity + ')');
            innerGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        }
        else {
            this.ctx.translate(0, -100);
            innerGradient.addColorStop(0, 'rgba(0, 0, 0, ' + this.shadow.opacity + ')');
            innerGradient.addColorStop(0.1, 'rgba(0, 0, 0, 0.05)');
            innerGradient.addColorStop(0.3, 'rgba(0, 0, 0, ' + this.shadow.opacity + ')');
            innerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }
        this.ctx.clip();
        this.ctx.fillStyle = innerGradient;
        this.ctx.fillRect(0, 0, isw, rect.height * 2);
        this.ctx.restore();
    }
    clear() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

/**
 * Class responsible for rendering the HTML book
 */
class HTMLRender extends Render {
    /** Parent HTML Element */
    element;
    /** Pages List as HTMLElements */
    items;
    outerShadow = null;
    innerShadow = null;
    hardShadow = null;
    hardInnerShadow = null;
    /**
     * @constructor
     *
     * @param {PageFlip} app - PageFlip object
     * @param {FlipSetting} setting - Configuration object
     * @param {HTMLElement} element - Parent HTML Element
     */
    constructor(app, element) {
        super(app);
        this.element = element;
        this.createShadows();
    }
    createShadows() {
        this.element.insertAdjacentHTML('beforeend', `<div class="stf__outerShadow"></div>
             <div class="stf__innerShadow"></div>
             <div class="stf__hardShadow"></div>
             <div class="stf__hardInnerShadow"></div>`);
        this.outerShadow = this.element.querySelector('.stf__outerShadow');
        this.innerShadow = this.element.querySelector('.stf__innerShadow');
        this.hardShadow = this.element.querySelector('.stf__hardShadow');
        this.hardInnerShadow = this.element.querySelector('.stf__hardInnerShadow');
    }
    clearShadow() {
        super.clearShadow();
        this.outerShadow.style.cssText = 'display: none';
        this.innerShadow.style.cssText = 'display: none';
        this.hardShadow.style.cssText = 'display: none';
        this.hardInnerShadow.style.cssText = 'display: none';
    }
    reload() {
        const testShadow = this.element.querySelector('.stf__outerShadow');
        if (!testShadow) {
            this.createShadows();
        }
    }
    /**
     * Draw inner shadow to the hard page
     */
    drawHardInnerShadow() {
        const rect = this.getRect();
        const progress = this.shadow.progress > 100 ? 200 - this.shadow.progress : this.shadow.progress;
        let innerShadowSize = ((100 - progress) * (2.5 * rect.pageWidth)) / 100 + 20;
        if (innerShadowSize > rect.pageWidth)
            innerShadowSize = rect.pageWidth;
        let newStyle = `
            display: block;
            z-index: ${(this.getSettings().startZIndex + 5).toString(10)};
            width: ${innerShadowSize}px;
            height: ${rect.height}px;
            background: linear-gradient(to right,
                rgba(0, 0, 0, ${(this.shadow.opacity * progress) / 100}) 5%,
                rgba(0, 0, 0, 0) 100%);
            left: ${rect.left + rect.width / 2}px;
            transform-origin: 0 0;
        `;
        newStyle +=
            (this.getDirection() === FlipDirection.FORWARD && this.shadow.progress > 100) ||
                (this.getDirection() === FlipDirection.BACK && this.shadow.progress <= 100)
                ? `transform: translate3d(0, 0, 0);`
                : `transform: translate3d(0, 0, 0) rotateY(180deg);`;
        this.hardInnerShadow.style.cssText = newStyle;
    }
    /**
     * Draw outer shadow to the hard page
     */
    drawHardOuterShadow() {
        const rect = this.getRect();
        const progress = this.shadow.progress > 100 ? 200 - this.shadow.progress : this.shadow.progress;
        let shadowSize = ((100 - progress) * (2.5 * rect.pageWidth)) / 100 + 20;
        if (shadowSize > rect.pageWidth)
            shadowSize = rect.pageWidth;
        let newStyle = `
            display: block;
            z-index: ${(this.getSettings().startZIndex + 4).toString(10)};
            width: ${shadowSize}px;
            height: ${rect.height}px;
            background: linear-gradient(to left, rgba(0, 0, 0, ${this.shadow.opacity}) 5%, rgba(0, 0, 0, 0) 100%);
            left: ${rect.left + rect.width / 2}px;
            transform-origin: 0 0;
        `;
        newStyle +=
            (this.getDirection() === FlipDirection.FORWARD && this.shadow.progress > 100) ||
                (this.getDirection() === FlipDirection.BACK && this.shadow.progress <= 100)
                ? `transform: translate3d(0, 0, 0) rotateY(180deg);`
                : `transform: translate3d(0, 0, 0);`;
        this.hardShadow.style.cssText = newStyle;
    }
    /**
     * Draw inner shadow to the soft page
     */
    drawInnerShadow() {
        const rect = this.getRect();
        const innerShadowSize = (this.shadow.width * 3) / 4;
        const shadowTranslate = this.getDirection() === FlipDirection.FORWARD ? innerShadowSize : 0;
        const shadowDirection = this.getDirection() === FlipDirection.FORWARD ? 'to left' : 'to right';
        const shadowPos = this.convertToGlobal(this.shadow.pos);
        const angle = this.shadow.angle + (3 * Math.PI) / 2;
        const clip = [
            this.pageRect.topLeft,
            this.pageRect.topRight,
            this.pageRect.bottomRight,
            this.pageRect.bottomLeft,
        ];
        let polygon = 'polygon( ';
        for (const p of clip) {
            let g = this.getDirection() === FlipDirection.BACK
                ? {
                    x: -p.x + this.shadow.pos.x,
                    y: p.y - this.shadow.pos.y,
                }
                : {
                    x: p.x - this.shadow.pos.x,
                    y: p.y - this.shadow.pos.y,
                };
            g = Helper.GetRotatedPoint(g, { x: shadowTranslate, y: 100 }, angle);
            polygon += g.x + 'px ' + g.y + 'px, ';
        }
        polygon = polygon.slice(0, -2);
        polygon += ')';
        const newStyle = `
            display: block;
            z-index: ${(this.getSettings().startZIndex + 10).toString(10)};
            width: ${innerShadowSize}px;
            height: ${rect.height * 2}px;
            background: linear-gradient(${shadowDirection},
                rgba(0, 0, 0, ${this.shadow.opacity}) 5%,
                rgba(0, 0, 0, 0.05) 15%,
                rgba(0, 0, 0, ${this.shadow.opacity}) 35%,
                rgba(0, 0, 0, 0) 100%);
            transform-origin: ${shadowTranslate}px 100px;
            transform: translate3d(${shadowPos.x - shadowTranslate}px, ${shadowPos.y - 100}px, 0) rotate(${angle}rad);
            clip-path: ${polygon};
            -webkit-clip-path: ${polygon};
        `;
        this.innerShadow.style.cssText = newStyle;
    }
    /**
     * Draw outer shadow to the soft page
     */
    drawOuterShadow() {
        const rect = this.getRect();
        const shadowPos = this.convertToGlobal({ x: this.shadow.pos.x, y: this.shadow.pos.y });
        const angle = this.shadow.angle + (3 * Math.PI) / 2;
        const shadowTranslate = this.getDirection() === FlipDirection.BACK ? this.shadow.width : 0;
        const shadowDirection = this.getDirection() === FlipDirection.FORWARD ? 'to right' : 'to left';
        const clip = [
            { x: 0, y: 0 },
            { x: rect.pageWidth, y: 0 },
            { x: rect.pageWidth, y: rect.height },
            { x: 0, y: rect.height },
        ];
        let polygon = 'polygon( ';
        for (const p of clip) {
            if (p !== null) {
                let g = this.getDirection() === FlipDirection.BACK
                    ? {
                        x: -p.x + this.shadow.pos.x,
                        y: p.y - this.shadow.pos.y,
                    }
                    : {
                        x: p.x - this.shadow.pos.x,
                        y: p.y - this.shadow.pos.y,
                    };
                g = Helper.GetRotatedPoint(g, { x: shadowTranslate, y: 100 }, angle);
                polygon += g.x + 'px ' + g.y + 'px, ';
            }
        }
        polygon = polygon.slice(0, -2);
        polygon += ')';
        const newStyle = `
            display: block;
            z-index: ${(this.getSettings().startZIndex + 10).toString(10)};
            width: ${this.shadow.width}px;
            height: ${rect.height * 2}px;
            background: linear-gradient(${shadowDirection}, rgba(0, 0, 0, ${this.shadow.opacity}), rgba(0, 0, 0, 0));
            transform-origin: ${shadowTranslate}px 100px;
            transform: translate3d(${shadowPos.x - shadowTranslate}px, ${shadowPos.y - 100}px, 0) rotate(${angle}rad);
            clip-path: ${polygon};
            -webkit-clip-path: ${polygon};
        `;
        this.outerShadow.style.cssText = newStyle;
    }
    /**
     * Draw left static page
     */
    drawLeftPage() {
        if (this.orientation === Orientation.PORTRAIT || this.leftPage === null)
            return;
        if (this.direction === FlipDirection.BACK &&
            this.flippingPage !== null &&
            this.flippingPage.getDrawingDensity() === PageDensity.HARD) {
            this.leftPage.getElement().style.zIndex = (this.getSettings().startZIndex + 5).toString(10);
            this.leftPage.setHardDrawingAngle(180 + this.flippingPage.getHardAngle());
            this.leftPage.draw(this.flippingPage.getDrawingDensity());
        }
        else {
            this.leftPage.simpleDraw(PageOrientation.LEFT);
        }
    }
    /**
     * Draw right static page
     */
    drawRightPage() {
        if (this.rightPage === null)
            return;
        // PORTRAIT is always the right page
        if (this.direction === FlipDirection.FORWARD &&
            this.flippingPage !== null &&
            this.flippingPage.getDrawingDensity() === PageDensity.HARD) {
            this.rightPage.getElement().style.zIndex = (this.getSettings().startZIndex + 5).toString(10);
            this.rightPage.setHardDrawingAngle(180 + this.flippingPage.getHardAngle());
            this.rightPage.draw(this.flippingPage.getDrawingDensity());
        }
        else {
            this.rightPage.simpleDraw(PageOrientation.RIGHT);
        }
    }
    /**
     * Draw the next page at the time of flipping
     */
    drawBottomPage() {
        if (this.bottomPage === null)
            return;
        const tempDensity = this.flippingPage != null ? this.flippingPage.getDrawingDensity() : null;
        if (!(this.orientation === Orientation.PORTRAIT && this.direction === FlipDirection.BACK)) {
            this.bottomPage.getElement().style.zIndex = (this.getSettings().startZIndex + 3).toString(10);
            this.bottomPage.draw(tempDensity);
        }
    }
    drawFrame() {
        this.clear();
        this.drawLeftPage();
        this.drawRightPage();
        this.drawBottomPage();
        if (this.flippingPage != null) {
            this.flippingPage.getElement().style.zIndex = (this.getSettings().startZIndex + 5).toString(10);
            this.flippingPage.draw();
        }
        if (this.shadow != null && this.flippingPage !== null) {
            if (this.flippingPage.getDrawingDensity() === PageDensity.SOFT) {
                this.drawOuterShadow();
                this.drawInnerShadow();
            }
            else {
                this.drawHardOuterShadow();
                this.drawHardInnerShadow();
            }
        }
    }
    clear() {
        for (const page of this.app.getPageCollection().getPages()) {
            if (page !== this.leftPage &&
                page !== this.rightPage &&
                page !== this.flippingPage &&
                page !== this.bottomPage) {
                page.getElement().style.cssText = 'display: none';
            }
            if (page.getTemporaryCopy() !== this.flippingPage) {
                page.hideTemporaryCopy();
            }
        }
    }
    update() {
        super.update();
        if (this.rightPage !== null) {
            this.rightPage.setOrientation(PageOrientation.RIGHT);
        }
        if (this.leftPage !== null) {
            this.leftPage.setOrientation(PageOrientation.LEFT);
        }
    }
}

/**
 * Class representing mathematical methods for calculating page position (rotation angle, clip area ...)
 */
class FlipCalculation {
    direction;
    corner;
    /** Calculated rotation angle to flipping page */
    angle;
    /** Calculated position to flipping page */
    position;
    rect;
    /** The point of intersection of the page with the borders of the book */
    topIntersectPoint = null; // With top border
    sideIntersectPoint = null; // With side border
    bottomIntersectPoint = null; // With bottom border
    pageWidth;
    pageHeight;
    /**
     * @constructor
     *
     * @param {FlipDirection} direction - Flipping direction
     * @param {FlipCorner} corner - Flipping corner
     * @param pageWidth - Current page width
     * @param pageHeight - Current page height
     */
    constructor(direction, corner, pageWidth, pageHeight) {
        this.direction = direction;
        this.corner = corner;
        this.pageWidth = parseInt(pageWidth, 10);
        this.pageHeight = parseInt(pageHeight, 10);
    }
    /**
     * The main calculation method
     *
     * @param {Point} localPos - Touch Point Coordinates (relative active page!)
     *
     * @returns {boolean} True - if the calculations were successful, false if errors occurred
     */
    calc(localPos) {
        try {
            // Find: page rotation angle and active corner position
            this.position = this.calcAngleAndPosition(localPos);
            // Find the intersection points of the scrolling page and the book
            this.calculateIntersectPoint(this.position);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Get the crop area for the flipping page
     *
     * @returns {Point[]} Polygon page
     */
    getFlippingClipArea() {
        const result = [];
        let clipBottom = false;
        result.push(this.rect.topLeft);
        result.push(this.topIntersectPoint);
        if (this.sideIntersectPoint === null) {
            clipBottom = true;
        }
        else {
            result.push(this.sideIntersectPoint);
            if (this.bottomIntersectPoint === null)
                clipBottom = false;
        }
        result.push(this.bottomIntersectPoint);
        if (clipBottom || this.corner === FlipCorner.BOTTOM) {
            result.push(this.rect.bottomLeft);
        }
        return result;
    }
    /**
     * Get the crop area for the page that is below the page to be flipped
     *
     * @returns {Point[]} Polygon page
     */
    getBottomClipArea() {
        const result = [];
        result.push(this.topIntersectPoint);
        if (this.corner === FlipCorner.TOP) {
            result.push({ x: this.pageWidth, y: 0 });
        }
        else {
            if (this.topIntersectPoint !== null) {
                result.push({ x: this.pageWidth, y: 0 });
            }
            result.push({ x: this.pageWidth, y: this.pageHeight });
        }
        if (this.sideIntersectPoint !== null) {
            if (Helper.GetDistanceBetweenTwoPoint(this.sideIntersectPoint, this.topIntersectPoint) >= 10)
                result.push(this.sideIntersectPoint);
        }
        else {
            if (this.corner === FlipCorner.TOP) {
                result.push({ x: this.pageWidth, y: this.pageHeight });
            }
        }
        result.push(this.bottomIntersectPoint);
        result.push(this.topIntersectPoint);
        return result;
    }
    /**
     * Get page rotation angle
     */
    getAngle() {
        if (this.direction === FlipDirection.FORWARD) {
            return -this.angle;
        }
        return this.angle;
    }
    /**
     * Get page area while flipping
     */
    getRect() {
        return this.rect;
    }
    /**
     * Get the position of the active angle when turning
     */
    getPosition() {
        return this.position;
    }
    /**
     * Get the active corner of the page (which pull)
     */
    getActiveCorner() {
        if (this.direction === FlipDirection.FORWARD) {
            return this.rect.topLeft;
        }
        return this.rect.topRight;
    }
    /**
     * Get flipping direction
     */
    getDirection() {
        return this.direction;
    }
    /**
     * Get flipping progress (0-100)
     */
    getFlippingProgress() {
        return Math.abs(((this.position.x - this.pageWidth) / (2 * this.pageWidth)) * 100);
    }
    /**
     * Get flipping corner position (top, bottom)
     */
    getCorner() {
        return this.corner;
    }
    /**
     * Get start position for the page that is below the page to be flipped
     */
    getBottomPagePosition() {
        if (this.direction === FlipDirection.BACK) {
            return { x: this.pageWidth, y: 0 };
        }
        return { x: 0, y: 0 };
    }
    /**
     * Get the starting position of the shadow
     */
    getShadowStartPoint() {
        if (this.corner === FlipCorner.TOP) {
            return this.topIntersectPoint;
        }
        else {
            if (this.sideIntersectPoint !== null)
                return this.sideIntersectPoint;
            return this.topIntersectPoint;
        }
    }
    /**
     * Get the rotate angle of the shadow
     */
    getShadowAngle() {
        const angle = Helper.GetAngleBetweenTwoLine(this.getSegmentToShadowLine(), [
            { x: 0, y: 0 },
            { x: this.pageWidth, y: 0 },
        ]);
        if (this.direction === FlipDirection.FORWARD) {
            return angle;
        }
        return Math.PI - angle;
    }
    calcAngleAndPosition(pos) {
        let result = pos;
        this.updateAngleAndGeometry(result);
        if (this.corner === FlipCorner.TOP) {
            result = this.checkPositionAtCenterLine(result, { x: 0, y: 0 }, { x: 0, y: this.pageHeight });
        }
        else {
            result = this.checkPositionAtCenterLine(result, { x: 0, y: this.pageHeight }, { x: 0, y: 0 });
        }
        if (Math.abs(result.x - this.pageWidth) < 1 && Math.abs(result.y) < 1) {
            throw new Error('Point is too small');
        }
        return result;
    }
    updateAngleAndGeometry(pos) {
        this.angle = this.calculateAngle(pos);
        this.rect = this.getPageRect(pos);
    }
    calculateAngle(pos) {
        const left = this.pageWidth - pos.x + 1;
        const top = this.corner === FlipCorner.BOTTOM ? this.pageHeight - pos.y : pos.y;
        let angle = 2 * Math.acos(left / Math.sqrt(top * top + left * left));
        if (top < 0)
            angle = -angle;
        const da = Math.PI - angle;
        if (!isFinite(angle) || (da >= 0 && da < 0.003))
            throw new Error('The G point is too small');
        if (this.corner === FlipCorner.BOTTOM)
            angle = -angle;
        return angle;
    }
    getPageRect(localPos) {
        if (this.corner === FlipCorner.TOP) {
            return this.getRectFromBasePoint([
                { x: 0, y: 0 },
                { x: this.pageWidth, y: 0 },
                { x: 0, y: this.pageHeight },
                { x: this.pageWidth, y: this.pageHeight },
            ], localPos);
        }
        return this.getRectFromBasePoint([
            { x: 0, y: -this.pageHeight },
            { x: this.pageWidth, y: -this.pageHeight },
            { x: 0, y: 0 },
            { x: this.pageWidth, y: 0 },
        ], localPos);
    }
    getRectFromBasePoint(points, localPos) {
        return {
            topLeft: this.getRotatedPoint(points[0], localPos),
            topRight: this.getRotatedPoint(points[1], localPos),
            bottomLeft: this.getRotatedPoint(points[2], localPos),
            bottomRight: this.getRotatedPoint(points[3], localPos),
        };
    }
    getRotatedPoint(transformedPoint, startPoint) {
        return {
            x: transformedPoint.x * Math.cos(this.angle) +
                transformedPoint.y * Math.sin(this.angle) +
                startPoint.x,
            y: transformedPoint.y * Math.cos(this.angle) -
                transformedPoint.x * Math.sin(this.angle) +
                startPoint.y,
        };
    }
    calculateIntersectPoint(pos) {
        const boundRect = {
            left: -1,
            top: -1,
            width: this.pageWidth + 2,
            height: this.pageHeight + 2,
        };
        if (this.corner === FlipCorner.TOP) {
            this.topIntersectPoint = Helper.GetIntersectBetweenTwoSegment(boundRect, [pos, this.rect.topRight], [
                { x: 0, y: 0 },
                { x: this.pageWidth, y: 0 },
            ]);
            this.sideIntersectPoint = Helper.GetIntersectBetweenTwoSegment(boundRect, [pos, this.rect.bottomLeft], [
                { x: this.pageWidth, y: 0 },
                { x: this.pageWidth, y: this.pageHeight },
            ]);
            this.bottomIntersectPoint = Helper.GetIntersectBetweenTwoSegment(boundRect, [this.rect.bottomLeft, this.rect.bottomRight], [
                { x: 0, y: this.pageHeight },
                { x: this.pageWidth, y: this.pageHeight },
            ]);
        }
        else {
            this.topIntersectPoint = Helper.GetIntersectBetweenTwoSegment(boundRect, [this.rect.topLeft, this.rect.topRight], [
                { x: 0, y: 0 },
                { x: this.pageWidth, y: 0 },
            ]);
            this.sideIntersectPoint = Helper.GetIntersectBetweenTwoSegment(boundRect, [pos, this.rect.topLeft], [
                { x: this.pageWidth, y: 0 },
                { x: this.pageWidth, y: this.pageHeight },
            ]);
            this.bottomIntersectPoint = Helper.GetIntersectBetweenTwoSegment(boundRect, [this.rect.bottomLeft, this.rect.bottomRight], [
                { x: 0, y: this.pageHeight },
                { x: this.pageWidth, y: this.pageHeight },
            ]);
        }
    }
    checkPositionAtCenterLine(checkedPos, centerOne, centerTwo) {
        let result = checkedPos;
        const tmp = Helper.LimitPointToCircle(centerOne, this.pageWidth, result);
        if (result !== tmp) {
            result = tmp;
            this.updateAngleAndGeometry(result);
        }
        const rad = Math.sqrt(Math.pow(this.pageWidth, 2) + Math.pow(this.pageHeight, 2));
        let checkPointOne = this.rect.bottomRight;
        let checkPointTwo = this.rect.topLeft;
        if (this.corner === FlipCorner.BOTTOM) {
            checkPointOne = this.rect.topRight;
            checkPointTwo = this.rect.bottomLeft;
        }
        if (checkPointOne.x <= 0) {
            const bottomPoint = Helper.LimitPointToCircle(centerTwo, rad, checkPointTwo);
            if (bottomPoint !== result) {
                result = bottomPoint;
                this.updateAngleAndGeometry(result);
            }
        }
        return result;
    }
    getSegmentToShadowLine() {
        const first = this.getShadowStartPoint();
        const second = first !== this.sideIntersectPoint && this.sideIntersectPoint !== null
            ? this.sideIntersectPoint
            : this.bottomIntersectPoint;
        return [first, second];
    }
}

/**
 * Class representing the flipping process
 */
class Flip {
    render;
    app;
    flippingPage = null;
    bottomPage = null;
    calc = null;
    state = FlippingState.READ;
    constructor(render, app) {
        this.render = render;
        this.app = app;
    }
    /**
     * Called when the page folding (User drags page corner)
     *
     * @param globalPos - Touch Point Coordinates (relative window)
     */
    fold(globalPos) {
        this.setState(FlippingState.USER_FOLD);
        // If the process has not started yet
        if (this.calc === null)
            this.start(globalPos);
        this.do(this.render.convertToPage(globalPos));
    }
    /**
     * Page turning with animation
     *
     * @param globalPos - Touch Point Coordinates (relative window)
     */
    flip(globalPos) {
        let flipType = this.app.getSettings().clickFlipType;
        if (flipType === ClickFlipType.DISABLE_FLIPPING) {
            return;
        }
        if (flipType === ClickFlipType.ONLY_ON_CORNERS) {
            const on_corner = this.isPointOnCorners(globalPos);
            if (!on_corner) {
                return;
            }
        }
        // flipType is ONLY_VIA_API or ANYWHERE_ON_PAGE
        // orginal was disableFlipByClick && !this.isPointOnCorners(globalPos)
        // means you can flip the page by clicking on the corner
        // the flipiing process is already running
        if (this.calc !== null)
            this.render.finishAnimation();
        if (!this.start(globalPos))
            return;
        const rect = this.getBoundsRect();
        this.setState(FlippingState.FLIPPING);
        // Margin from top to start flipping
        const topMargins = rect.height / 10;
        // Defining animation start points
        const yStart = this.calc.getCorner() === FlipCorner.BOTTOM ? rect.height - topMargins : topMargins;
        const yDest = this.calc.getCorner() === FlipCorner.BOTTOM ? rect.height : 0;
        // Сalculations for these points
        this.calc.calc({ x: rect.pageWidth - topMargins, y: yStart });
        // Run flipping animation
        this.animateFlippingTo({ x: rect.pageWidth - topMargins, y: yStart }, { x: -rect.pageWidth, y: yDest }, true);
    }
    /**
     * Start the flipping process. Find direction and corner of flipping. Creating an object for calculation.
     *
     * @param {Point} globalPos - Touch Point Coordinates (relative window)
     *
     * @returns {boolean} True if flipping is possible, false otherwise
     */
    start(globalPos) {
        this.reset();
        const bookPos = this.render.convertToBook(globalPos);
        const rect = this.getBoundsRect();
        // Find the direction of flipping
        const direction = this.getDirectionByPoint(bookPos);
        // Find the active corner
        const flipCorner = bookPos.y >= rect.height / 2 ? FlipCorner.BOTTOM : FlipCorner.TOP;
        if (!this.checkDirection(direction))
            return false;
        try {
            this.flippingPage = this.app.getPageCollection().getFlippingPage(direction);
            this.bottomPage = this.app.getPageCollection().getBottomPage(direction);
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
                }
                else {
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
            this.calc = new FlipCalculation(direction, flipCorner, rect.pageWidth.toString(10), // fix bug with type casting
            rect.height.toString(10) // fix bug with type casting
            );
            return true;
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Perform calculations for the current page position. Pass data to render object
     *
     * @param {Point} pagePos - Touch Point Coordinates (relative active page)
     */
    do(pagePos) {
        if (this.calc === null)
            return; // Flipping process not started
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
            }
            else {
                this.flippingPage.setHardAngle((-90 * (200 - progress * 2)) / 100);
            }
            this.render.setPageRect(this.calc.getRect());
            this.render.setBottomPage(this.bottomPage);
            this.render.setFlippingPage(this.flippingPage);
            this.render.setShadowData(this.calc.getShadowStartPoint(), this.calc.getShadowAngle(), progress, this.calc.getDirection());
        }
    }
    /**
     * Turn to the specified page number (with animation)
     *
     * @param {number} page - New page number
     * @param {FlipCorner} corner - Active page corner when turning
     */
    flipToPage(page, corner) {
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
        }
        catch (e) {
            //
        }
    }
    /**
     * Turn to the next page (with animation)
     *
     * @param {FlipCorner} corner - Active page corner when turning
     */
    flipNext(corner) {
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
    flipPrev(corner) {
        this.flip({
            x: 10,
            y: corner === FlipCorner.TOP ? 1 : this.render.getRect().height - 2,
        });
    }
    /**
     * Called when the user has stopped flipping
     */
    stopMove() {
        if (this.calc === null)
            return;
        const pos = this.calc.getPosition();
        const rect = this.getBoundsRect();
        const y = this.calc.getCorner() === FlipCorner.BOTTOM ? rect.height : 0;
        if (pos.x <= 0)
            this.animateFlippingTo(pos, { x: -rect.pageWidth, y }, true);
        else
            this.animateFlippingTo(pos, { x: rect.pageWidth, y }, false);
    }
    /**
     * Fold the corners of the book when the mouse pointer is over them.
     * Called when the mouse pointer is over the book without clicking
     *
     * @param globalPos
     */
    showCorner(globalPos) {
        if (!this.checkState(FlippingState.READ, FlippingState.FOLD_CORNER))
            return;
        const rect = this.getBoundsRect();
        const pageWidth = rect.pageWidth;
        if (this.isPointOnCorners(globalPos)) {
            if (this.calc === null) {
                if (!this.start(globalPos))
                    return;
                this.setState(FlippingState.FOLD_CORNER);
                this.calc.calc({ x: pageWidth - 1, y: 1 });
                const fixedCornerSize = 50;
                const yStart = this.calc.getCorner() === FlipCorner.BOTTOM ? rect.height - 1 : 1;
                const yDest = this.calc.getCorner() === FlipCorner.BOTTOM
                    ? rect.height - fixedCornerSize
                    : fixedCornerSize;
                this.animateFlippingTo({ x: pageWidth - 1, y: yStart }, { x: pageWidth - fixedCornerSize, y: yDest }, false, false);
            }
            else {
                this.do(this.render.convertToPage(globalPos));
            }
        }
        else {
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
    animateFlippingTo(start, dest, isTurned, needReset = true) {
        const points = Helper.GetCordsFromTwoPoint(start, dest);
        // Create frames
        const frames = [];
        for (const p of points)
            frames.push(() => this.do(p));
        const duration = this.getAnimationDuration(points.length);
        this.render.startAnimation(frames, duration, () => {
            // callback function
            if (!this.calc)
                return;
            if (isTurned) {
                if (this.calc.getDirection() === FlipDirection.BACK)
                    this.app.turnToPrevPage();
                else
                    this.app.turnToNextPage();
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
    getCalculation() {
        return this.calc;
    }
    /**
     * Get current flipping state
     */
    getState() {
        return this.state;
    }
    setState(newState) {
        if (this.state !== newState) {
            this.app.updateState(newState);
            this.state = newState;
        }
    }
    getDirectionByPoint(touchPos) {
        const rect = this.getBoundsRect();
        if (this.render.getOrientation() === Orientation.PORTRAIT) {
            if (touchPos.x - rect.pageWidth <= rect.width / 5) {
                return FlipDirection.BACK;
            }
        }
        else if (touchPos.x < rect.width / 2) {
            return FlipDirection.BACK;
        }
        return FlipDirection.FORWARD;
    }
    getAnimationDuration(size) {
        const defaultTime = this.app.getSettings().flippingTime;
        if (size >= 1000)
            return defaultTime;
        return (size / 1000) * defaultTime;
    }
    checkDirection(direction) {
        if (direction === FlipDirection.FORWARD)
            return this.app.getCurrentPageIndex() < this.app.getPageCount() - 1;
        return this.app.getCurrentPageIndex() >= 1;
    }
    reset() {
        this.calc = null;
        this.flippingPage = null;
        this.bottomPage = null;
    }
    getBoundsRect() {
        return this.render.getRect();
    }
    checkState(...states) {
        for (const state of states) {
            if (this.state === state)
                return true;
        }
        return false;
    }
    isPointOnCorners(globalPos) {
        // globalPos:relative to the book
        const rect = this.getBoundsRect();
        const pageWidth = rect.pageWidth;
        const operatingDistance = Math.sqrt(Math.pow(pageWidth, 2) + Math.pow(rect.height, 2)) / 5;
        const bookPos = this.render.convertToBook(globalPos);
        return (bookPos.x > 0 &&
            bookPos.y > 0 &&
            bookPos.x < rect.width &&
            bookPos.y < rect.height &&
            (bookPos.x < operatingDistance || bookPos.x > rect.width - operatingDistance) &&
            (bookPos.y < operatingDistance || bookPos.y > rect.height - operatingDistance));
    }
}

/**
 * A class implementing a basic event model
 */
class EventObject {
    events = new Map();
    /**
     * Add new event handler
     *
     * @param {string} eventName
     * @param {EventCallback} callback
     */
    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, [callback]);
        }
        else {
            this.events.get(eventName).push(callback);
        }
        return this;
    }
    /**
     * Removing all handlers from an event
     *
     * @param {string} event - Event name
     */
    off(event) {
        this.events.delete(event);
    }
    trigger(eventName, app, data = null) {
        if (!this.events.has(eventName))
            return;
        for (const callback of this.events.get(eventName)) {
            callback({ data, object: app });
        }
    }
}

/**
 * Class representing a main PageFlip object
 *
 * @extends EventObject
 */
class PageFlip extends EventObject {
    mousePosition;
    isUserTouch = false;
    isUserMove = false;
    setting;
    block; // Root HTML Element
    pages = null;
    flipController;
    render;
    ui;
    /**
     * Create a new PageFlip instance
     *
     * @constructor
     * @param {HTMLElement} inBlock - Root HTML Element
     * @param {Object} setting - Configuration object
     */
    constructor(inBlock, setting) {
        super();
        this.setting = new Settings().getSettings(setting);
        this.block = inBlock;
    }
    setSettings(settings) {
        this.ui.removeHandlers();
        this.setting = settings;
        this.ui.setHandlers();
    }
    /**
     * Destructor. Remove a root HTML element and all event handlers
     */
    destroy() {
        this.ui.destroy();
        this.block.remove();
    }
    /**
     * Update the render area. Re-show current page.
     */
    update() {
        this.render.update();
        this.pages.show();
    }
    /**
     * Load pages from images on the Canvas mode
     *
     * @param {string[]} imagesHref - List of paths to images
     */
    loadFromImages(imagesHref) {
        this.ui = new CanvasUI(this.block, this);
        const canvas = this.ui.getCanvas();
        this.render = new CanvasRender(this, canvas);
        this.flipController = new Flip(this.render, this);
        this.pages = new ImagePageCollection(this, this.render, imagesHref);
        this.pages.load();
        this.render.start();
        this.pages.show(this.getSettings().startPage);
        // safari fix
        setTimeout(() => {
            this.ui.update();
            this.trigger('init', this, {
                page: this.getSettings().startPage,
                mode: this.render.getOrientation(),
            });
        }, 1);
    }
    /**
     * Load pages from HTML elements on the HTML mode
     *
     * @param {(NodeListOf<HTMLElement>|HTMLElement[])} items - List of pages as HTML Element
     */
    loadFromHTML(items) {
        this.ui = new HTMLUI(this.block, this, items);
        this.render = new HTMLRender(this, this.ui.getDistElement());
        this.flipController = new Flip(this.render, this);
        this.pages = new HTMLPageCollection(this, this.render, this.ui.getDistElement(), items);
        this.pages.load();
        this.render.start();
        this.pages.show(this.getSettings().startPage);
        // safari fix
        setTimeout(() => {
            this.ui.update();
            this.trigger('init', this, {
                page: this.getSettings().startPage,
                mode: this.render.getOrientation(),
            });
        }, 1);
    }
    /**
     * Update current pages from images
     *
     * @param {string[]} imagesHref - List of paths to images
     */
    updateFromImages(imagesHref) {
        const current = this.pages.getCurrentPageIndex();
        this.pages.destroy();
        this.pages = new ImagePageCollection(this, this.render, imagesHref);
        this.pages.load();
        this.pages.show(current);
        this.trigger('update', this, {
            page: current,
            mode: this.render.getOrientation(),
        });
    }
    /**
     * Update current pages from HTML
     *
     * @param {(NodeListOf<HTMLElement>|HTMLElement[])} items - List of pages as HTML Element
     */
    updateFromHtml(items) {
        const current = this.pages.getCurrentPageIndex();
        this.pages.destroy();
        this.pages = new HTMLPageCollection(this, this.render, this.ui.getDistElement(), items);
        this.pages.load();
        this.ui.updateItems(items);
        this.render.reload();
        this.pages.show(current);
        this.trigger('update', this, {
            page: current,
            mode: this.render.getOrientation(),
        });
    }
    /**
     * Clear pages from HTML (remove to initinalState)
     */
    clear() {
        this.pages.destroy();
        this.ui.clear();
    }
    /**
     * Turn to the previous page (without animation)
     */
    turnToPrevPage() {
        this.pages.showPrev();
    }
    /**
     * Turn to the next page (without animation)
     */
    turnToNextPage() {
        this.pages.showNext();
    }
    /**
     * Turn to the specified page number (without animation)
     *
     * @param {number} page - New page number
     */
    turnToPage(page) {
        this.pages.show(page);
    }
    /**
     * Turn to the next page (with animation)
     *
     * @param {FlipCorner} corner - Active page corner when turning
     */
    flipNext(corner = FlipCorner.TOP) {
        this.flipController.flipNext(corner);
    }
    /**
     * Turn to the prev page (with animation)
     *
     * @param {FlipCorner} corner - Active page corner when turning
     */
    flipPrev(corner = FlipCorner.TOP) {
        this.flipController.flipPrev(corner);
    }
    /**
     * Turn to the specified page number (with animation)
     *
     * @param {number} page - New page number
     * @param {FlipCorner} corner - Active page corner when turning
     */
    flip(page, corner = FlipCorner.TOP) {
        this.flipController.flipToPage(page, corner);
    }
    /**
     * Call a state change event trigger
     *
     * @param {FlippingState} newState - New  state of the object
     */
    updateState(newState) {
        this.trigger('changeState', this, newState);
    }
    /**
     * Call a page number change event trigger
     *
     * @param {number} newPage - New page Number
     */
    updatePageIndex(newPage) {
        this.trigger('flip', this, newPage);
    }
    /**
     * Call a page orientation change event trigger. Update UI and rendering area
     *
     * @param {Orientation} newOrientation - New page orientation (portrait, landscape)
     */
    updateOrientation(newOrientation) {
        this.ui.setOrientationStyle(newOrientation);
        this.update();
        this.trigger('changeOrientation', this, newOrientation);
    }
    /**
     * Get the total number of pages in a book
     *
     * @returns {number}
     */
    getPageCount() {
        return this.pages.getPageCount();
    }
    /**
     * Get the index of the current page in the page list (starts at 0)
     *
     * @returns {number}
     */
    getCurrentPageIndex() {
        return this.pages.getCurrentPageIndex();
    }
    /**
     * Get page from collection by number
     *
     * @param {number} pageIndex
     * @returns {Page}
     */
    getPage(pageIndex) {
        return this.pages.getPage(pageIndex);
    }
    /**
     * Get the current rendering object
     *
     * @returns {Render}
     */
    getRender() {
        return this.render;
    }
    /**
     * Get current object responsible for flipping
     *
     * @returns {Flip}
     */
    getFlipController() {
        return this.flipController;
    }
    /**
     * Get current page orientation
     *
     * @returns {Orientation} Сurrent orientation: portrait or landscape
     */
    getOrientation() {
        return this.render.getOrientation();
    }
    /**
     * Get current book sizes and position
     *
     * @returns {PageRect}
     */
    getBoundsRect() {
        return this.render.getRect();
    }
    /**
     * Get configuration object
     *
     * @returns {FlipSetting}
     */
    getSettings() {
        return this.setting;
    }
    /**
     * Get UI object
     *
     * @returns {UI}
     */
    getUI() {
        return this.ui;
    }
    /**
     * Get current flipping state
     *
     * @returns {FlippingState}
     */
    getState() {
        return this.flipController.getState();
    }
    /**
     * Get page collection
     *
     * @returns {PageCollection}
     */
    getPageCollection() {
        return this.pages;
    }
    /**
     * Start page turning. Called when a user clicks or touches
     *
     * @param {Point} pos - Touch position in coordinates relative to the book
     */
    startUserTouch(pos) {
        this.mousePosition = pos; // Save touch position
        this.isUserTouch = true;
        this.isUserMove = false;
    }
    /**
     * Called when a finger / mouse moves
     *
     * @param {Point} pos - Touch position in coordinates relative to the book
     * @param {boolean} isTouch - True if there was a touch event, not a mouse click
     */
    userMove(pos, isTouch) {
        // let margin = 10
        // let w = this.getSettings().width + margin;
        // let h = this.getSettings().height + margin;
        // if (pos.x < -margin || pos.x > w || pos.y < -margin || pos.y > h) return;
        if (!this.isUserTouch && !isTouch && this.getSettings().showPageCorners) {
            this.flipController.showCorner(pos); // fold Page Corner
        }
        else if (this.isUserTouch) {
            if (Helper.GetDistanceBetweenTwoPoint(this.mousePosition, pos) > 5) {
                this.isUserMove = true;
                this.flipController.fold(pos);
            }
        }
    }
    /**
     * Сalled when the user has stopped touching
     *
     * @param {Point} pos - Touch end position in coordinates relative to the book
     * @param {boolean} isSwipe - true if there was a mobile swipe event
     */
    userStop(pos, isSwipe = false) {
        if (this.isUserTouch) {
            this.isUserTouch = false;
            if (!isSwipe) {
                if (!this.isUserMove)
                    this.flipController.flip(pos);
                else
                    this.flipController.stopMove();
            }
        }
    }
}

export { CanvasRender, CanvasUI, ClickFlipType, EventObject, Flip, FlipCalculation, FlipCorner, FlipDirection, FlippingState, HTMLPage, HTMLPageCollection, HTMLRender, HTMLUI, Helper, ImagePage, ImagePageCollection, Orientation, Page, PageCollection, PageDensity, PageFlip, PageOrientation, Render, Settings, UI };
