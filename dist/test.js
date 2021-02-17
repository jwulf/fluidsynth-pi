"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nact_1 = require("nact");
const system = nact_1.start();
function actorFn(state, msg, ctx) {
    if (msg.type === "LOAD") {
        nact_1.dispatch(msg.sender, { success: true });
    }
    return state;
}
const fileLoader = nact_1.spawn(system, actorFn, "Fileloader", { initialState: {} });
query(fileLoader, (sender) => ({
    sender,
    filename: "test.txt",
    type: "LOAD",
}), 250).then((result) => {
    result; // result is type Success
});
query(fileLoader, (sender) => ({
    sender,
    file: "test.txt",
    type: "SAVE",
}), 250).then((result) => {
    result; // result is type Failure
});
// type QueryMsgFactory<Req, Res> = (tempRef: Ref<Res>) => Req;
// type InferResponseFromMsgProtocol<Req> = Req extends { sender: Ref<infer K> }
//   ? K
//   : any;
// type queryFn = <
//   Msg,
//   MsgCreator extends QueryMsgFactory<Msg, any>
// >(
//   actor: Ref<Msg>,
//   queryFactory: MsgCreator,
//   timeout: number
// ) => Promise<Msg extends {sender: infer K} ? K: any>;
// declare const query: queryFn;
// export type QueryMsgFactory<Req, Res> = (tempRef: Ref<Res>) => Req;
//   export type InferResponseFromMsgFactory<T extends QueryMsgFactory<any, any>> = T extends QueryMsgFactory<any, infer Res> ? Res : never;
//   export function query<Msg, MsgCreator extends QueryMsgFactory<Msg, any>>(actor: Ref<Msg>, queryFactory: MsgCreator, timeout: Milliseconds): Promise<InferResponseFromMsgFactory<MsgCreator>>;
