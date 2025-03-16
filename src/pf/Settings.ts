// Book orientation

export enum Orientation {
    PORTRAIT = 'portrait',
    LANDSCAPE = 'landscape'
}

export enum ClickFlipType {
    // auto set useMouseEvents = true
    ANYWHERE_ON_PAGE = 1,
    ONLY_ON_CORNERS = 2,
    // ONLY_ON_LEFT_CORNER = 3,
    // ONLY_ON_RIGHT_CORNER = 4,

    // auto set to useMouseEvents = false
    DISABLE_FLIPPING = 5,
    ONLY_VIA_API = 6,
}

/**
 * Configuration object
 */
export interface FlipSetting {
    /** Page number from which to start viewing */
    startPage: number;

    width: number;
    height: number;
    orientation: Orientation;

    /** Draw shadows or not when page flipping */
    drawShadow: boolean;
    /** Flipping animation time */
    flippingTime: number;

    /** Initial value to z-index */
    startZIndex: number;
    /** Shadow intensity (1: max intensity, 0: hidden shadows) */
    maxShadowOpacity: number;

    /** If this value is true, the first and the last pages will be marked as hard and will be shown in single page mode */
    showCover: boolean;
    /** Disable content scrolling when touching a book on mobile devices */
    mobileScrollSupport: boolean;

    /** Set the forward event of clicking on child elements (buttons, links) */
    clickEventForward: boolean;

    swipeDistance: number;

    /** if this value is true, fold the corners of the book when the mouse pointer is over them. */
    showPageCorners: boolean;

    clickFlipType: ClickFlipType;
}

export const defaultSettings:FlipSetting = 
{
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
    showPageCorners: false,
    clickFlipType: ClickFlipType.ANYWHERE_ON_PAGE,
} as FlipSetting;

export class Settings {
    private _default: FlipSetting = defaultSettings;
    /**
     * Processing parameters received from the user. Substitution default values
     *
     * @param userSetting
     * @returns {FlipSetting} Сonfiguration object
     */
    public getSettings(userSetting: Record<string, number | string | boolean>): FlipSetting {
        const result = this._default;
        Object.assign(result, userSetting);

        if (result.width <= 0 || result.height <= 0) throw new Error('Invalid width or height');

        if (result.flippingTime <= 0) throw new Error('Invalid flipping time');

        return result;
    }
}
