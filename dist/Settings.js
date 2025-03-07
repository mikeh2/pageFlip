import { Orientation } from './Render/Render';
export var ClickFlipType;
(function (ClickFlipType) {
    // auto set useMouseEvents = true
    ClickFlipType[ClickFlipType["ANYWHERE_ON_PAGE"] = 1] = "ANYWHERE_ON_PAGE";
    ClickFlipType[ClickFlipType["ONLY_ON_CORNERS"] = 2] = "ONLY_ON_CORNERS";
    // auto set to useMouseEvents = false
    ClickFlipType[ClickFlipType["DISABLE_FLIPPING"] = 3] = "DISABLE_FLIPPING";
    ClickFlipType[ClickFlipType["ONLY_VIA_API"] = 4] = "ONLY_VIA_API";
})(ClickFlipType || (ClickFlipType = {}));
export class Settings {
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
//# sourceMappingURL=Settings.js.map