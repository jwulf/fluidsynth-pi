"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuController = exports.MenuControllerActorMessages = void 0;
const nact_1 = require("nact");
const MenuFavorites_1 = require("./MenuFavorites");
const MenuFontExplorer_1 = require("./MenuFontExplorer");
var MenuControllerActorMessages;
(function (MenuControllerActorMessages) {
    MenuControllerActorMessages["ACTIVATE_MENU"] = "ACTIVATE_MENU";
    MenuControllerActorMessages["ACTIVATE_THIS_MENU"] = "ACTIVATE_THIS_MENU";
    MenuControllerActorMessages["ADD_MENU"] = "ADD_MENU";
    MenuControllerActorMessages["DIAL_INTERACTION_EVENT"] = "DIAL_INTERACTION_EVENT";
})(MenuControllerActorMessages = exports.MenuControllerActorMessages || (exports.MenuControllerActorMessages = {}));
const MenuController = (root) => {
    const menuController = nact_1.spawn(root, (state = {
        activeMenu: undefined,
    }, msg, ctx) => {
        if (msg.type === MenuControllerActorMessages.DIAL_INTERACTION_EVENT) {
            if (state.activeMenu) {
                nact_1.dispatch(state.activeMenu, msg);
            }
            return state;
        }
        if (msg.type === MenuControllerActorMessages.ACTIVATE_MENU) {
            const activeMenu = ctx.children.get(msg.menuName);
            nact_1.dispatch(activeMenu, {
                type: MenuControllerActorMessages.ACTIVATE_MENU,
                state: msg.state,
            });
            return Object.assign(Object.assign({}, state), { activeMenu });
        }
        if (msg.type === MenuControllerActorMessages.ACTIVATE_THIS_MENU) {
            const { menu, name, state } = msg;
            const activeMenu = ctx.children.has(name)
                ? ctx.children.get(name)
                : menu(ctx.self, name);
            nact_1.dispatch(activeMenu, {
                type: MenuControllerActorMessages.ACTIVATE_MENU,
                state,
            });
            return Object.assign(Object.assign({}, state), { activeMenu });
        }
    });
    MenuFavorites_1.FavoriteMenu(menuController);
    MenuFontExplorer_1.FontExplorerMenu(menuController);
    return menuController;
};
exports.MenuController = MenuController;
