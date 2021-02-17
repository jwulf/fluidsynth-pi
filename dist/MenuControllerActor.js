"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuController = exports.MenuControllerActorMessages = void 0;
const nact_1 = require("nact");
var MenuControllerActorMessages;
(function (MenuControllerActorMessages) {
    MenuControllerActorMessages["ACTIVATE_MENU"] = "ACTIVATE_MENU";
    MenuControllerActorMessages["ADD_MENU"] = "ADD_MENU";
    MenuControllerActorMessages["DIAL_INTERACTION_EVENT"] = "DIAL_INTERACTION_EVENT";
})(MenuControllerActorMessages = exports.MenuControllerActorMessages || (exports.MenuControllerActorMessages = {}));
const MenuController = (root) => nact_1.spawn(root, (state = { activeMenu: undefined, menus: {} }, msg, ctx) => {
    if (msg.type === MenuControllerActorMessages.DIAL_INTERACTION_EVENT) {
        if (state.activeMenu) {
            nact_1.dispatch(state.activeMenu, msg);
        }
        return state;
    }
    if (msg.type === MenuControllerActorMessages.ADD_MENU) {
        return Object.assign(Object.assign({}, state), { menus: Object.assign(Object.assign({}, state.menus), { [msg.name]: msg.menu }) });
    }
    if (msg.type === MenuControllerActorMessages.ACTIVATE_MENU) {
        const activeMenu = state.menus[msg.menu];
        nact_1.dispatch(activeMenu, {
            type: MenuControllerActorMessages.ACTIVATE_MENU,
            state: msg.state,
        });
        return Object.assign(Object.assign({}, state), { activeMenu });
    }
});
exports.MenuController = MenuController;
