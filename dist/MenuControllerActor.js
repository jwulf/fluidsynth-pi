"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuController = exports.MenuControllerActorMessages = void 0;
const nact_1 = require("nact");
const ActorConstants_1 = require("./ActorConstants");
const MenuFavorites_1 = require("./MenuFavorites");
const MenuFontExplorer_1 = require("./MenuFontExplorer");
const MenuSystem_1 = require("./MenuSystem");
const ringlog_1 = require("./ringlog");
const log = ringlog_1.Log();
var MenuControllerActorMessages;
(function (MenuControllerActorMessages) {
    MenuControllerActorMessages["ACTIVATE_MENU"] = "ACTIVATE_MENU";
    MenuControllerActorMessages["ACTIVATE_THIS_MENU"] = "ACTIVATE_THIS_MENU";
    MenuControllerActorMessages["ADD_MENU"] = "ADD_MENU";
    MenuControllerActorMessages["DIAL_INTERACTION_EVENT"] = "DIAL_INTERACTION_EVENT";
})(MenuControllerActorMessages = exports.MenuControllerActorMessages || (exports.MenuControllerActorMessages = {}));
const MenuController = (parent) => {
    const menuController = nact_1.spawn(parent, (state = {
        activeMenu: undefined,
        previousMenus: [],
    }, msg, ctx) => {
        const activateMenu = (msg, activeMenu) => {
            log(`Activating menu ${msg.menuName}`);
            nact_1.dispatch(activeMenu, {
                type: MenuControllerActorMessages.ACTIVATE_MENU,
                menuState: msg.menuState,
            });
        };
        if (msg.type === MenuControllerActorMessages.DIAL_INTERACTION_EVENT) {
            if (msg.event_type === ActorConstants_1.DialInteractionEvent.BUTTON_LONG_PRESS) {
                const nextMenu = state.previousMenus.pop();
                if (nextMenu) {
                    nact_1.dispatch(nextMenu, {
                        type: MenuControllerActorMessages.ACTIVATE_MENU,
                    });
                    const activeMenu = nextMenu;
                    return Object.assign(Object.assign({}, state), { activeMenu });
                }
            }
            else if (state.activeMenu) {
                // delegate dial handler to active menu
                nact_1.dispatch(state.activeMenu, msg);
            }
            return state;
        }
        if (msg.type === MenuControllerActorMessages.ACTIVATE_MENU) {
            const activeMenu = ctx.children.get(msg.menuName);
            if (msg.menuName === "FAVORITES") {
                state.previousMenus = [ctx.children.get("SYSTEM")];
            }
            else {
                const previousMenu = state.activeMenu;
                if (previousMenu !== undefined) {
                    state.previousMenus.push(previousMenu);
                }
            }
            activateMenu(msg, activeMenu);
            return Object.assign(Object.assign({}, state), { activeMenu });
        }
        if (msg.type === MenuControllerActorMessages.ACTIVATE_THIS_MENU) {
            const { menuFactoryFn, menuName: name } = msg;
            const previousMenu = state.activeMenu;
            if (previousMenu !== undefined) {
                state.previousMenus.push(previousMenu);
            }
            const activeMenu = ctx.children.has(name)
                ? ctx.children.get(name)
                : menuFactoryFn(ctx.self, name);
            activateMenu(msg, activeMenu);
            return Object.assign(Object.assign({}, state), { activeMenu });
        }
    }, ActorConstants_1.Actor.MenuController);
    MenuFavorites_1.FavoriteMenu(menuController);
    MenuFontExplorer_1.FontExplorerMenu(menuController);
    MenuSystem_1.SystemMenu(menuController);
    return menuController;
};
exports.MenuController = MenuController;
