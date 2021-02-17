import { dispatch, spawn, Ref, start } from "nact";

type Success = { success: true };
type Failure = { success: false };

interface DoLoadMessage {
  type: "LOAD";
  filename: string;
  sender: Ref<Success>;
}

interface SaveFileMessage {
  type: "SAVE";
  file: string;
  sender: Ref<Failure>;
}

const system = start();

function actorFn(state: any, msg: DoLoadMessage | SaveFileMessage, ctx: any) {
  if (msg.type === "LOAD") {
    dispatch(msg.sender, { success: true });
  }
  return state;
}

const fileLoader = spawn(system, actorFn, "Fileloader", { initialState: {} });

query(
  fileLoader,
  (sender) => ({
    sender,
    filename: "test.txt",
    type: "LOAD",
  }),
  250
).then((result) => {
  result; // result is type Success
});

query(
  fileLoader,
  (sender) => ({
    sender,
    file: "test.txt",
    type: "SAVE",
  }),
  250
).then((result) => {
  result; // result is type Failure
});

type QueryMsgFactory<Req, Res> = (tempRef: Ref<Res>) => Req;
type Unref<T> = T extends Ref<infer K> ? K : any;
type queryFn = <
  Msg extends { sender: any },
  MsgCreator extends QueryMsgFactory<Msg, any>
>(
  actor: Ref<Msg>,
  queryFactory: MsgCreator,
  timeout: number
) => Promise<Unref<Msg["sender"]>>;

declare const query: queryFn;

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
