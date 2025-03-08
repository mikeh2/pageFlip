export declare enum Orientation {
    PORTRAIT = "portrait",
    LANDSCAPE = "landscape"
}
export declare enum ClickFlipType {
    ANYWHERE_ON_PAGE = 1,
    ONLY_ON_CORNERS = 2,
    DISABLE_FLIPPING = 3,
    ONLY_VIA_API = 4
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
export declare class Settings {
    private _default;
    /**
     * Processing parameters received from the user. Substitution default values
     *
     * @param userSetting
     * @returns {FlipSetting} Сonfiguration object
     */
    getSettings(userSetting: Record<string, number | string | boolean>): FlipSetting;
}
