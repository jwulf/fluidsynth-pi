import { ActorSystemRef, dispatch, Ref, spawn } from "nact";
import { Actor, OPERATION_SUCCESS } from "./ActorConstants";
import path from "path";
import fs from "fs";
import { Collection, CollectionItem, Cursor } from "./Collection";

export const SoundFontLibrary = (
  root: ActorSystemRef
): Ref<SoundFontLibraryMessage> =>
  spawn(
    root,
    (
      state: SoundFontLibraryState = {} as SoundFontLibraryState,
      msg: SoundFontLibraryMessage,
      ctx
    ) => {
      if (!state.files) {
        state.files = new Collection(scanSoundfontsOnDisk());
        state.favorites = new Collection(readFavorites());
      }
      if (msg.type === SoundFontLibraryMessageTypes.SCAN_LIBRARY) {
        state.files = new Collection(scanSoundfontsOnDisk());
        state.favorites = new Collection(readFavorites());
        return state;
      }
      if (msg.type === SoundFontLibraryMessageTypes.ADD_FAVORITE) {
        state.favorites.addItem(msg.favorite);
        writeFavorites(state.favorites);
        return state;
      }
      if (msg.type === SoundFontLibraryMessageTypes.REMOVE_FAVORITE) {
        state.favorites.removeItem(msg.favorite);
        dispatch(msg.sender, OPERATION_SUCCESS);
      }
      if (msg.type === SoundFontLibraryMessageTypes.CREATE_FILE_CURSOR) {
        const cursor = state.files.createCursor();
        dispatch(msg.sender, cursor);
        return state;
      }
      if (msg.type === SoundFontLibraryMessageTypes.CREATE_FAVORITE_CURSOR) {
        const cursor = state.favorites.createCursor();
        dispatch(msg.sender, cursor);
        return state;
      }
      return state;
    },
    Actor.SoundFontLibrary
  );

function scanSoundfontsOnDisk() {
  const soundFontFiles = fs
    .readdirSync(path.join(__dirname, "..", "soundfonts"))
    .filter((f) => f !== "soundfontLibrary.json")
    .map((f) => ({ filename: f, displayName: f.replace(".sf2", "") }));
  return soundFontFiles;
}

function readFavorites(): Favorite[] {
  const libFile = getLibraryFilePath();
  const libFileExists = fs.existsSync(libFile);
  return libFileExists ? require(libFile) : [];
}

function writeFavorites(library: Collection<Favorite>) {
  const libFile = getLibraryFilePath();
  fs.writeFileSync(libFile, JSON.stringify(library.getItems, null, 2));
}

function getLibraryFilePath() {
  return path.join(__dirname, "..", "soundfontLibrary.json");
}

export function fontExists(filename: string) {
  return fs.existsSync(path.join(getLibraryFilePath(), filename));
}
export interface SoundFontFile {
  filename: string;
  displayName: string;
}

export enum SoundFontLibraryMessageTypes {
  SCAN_LIBRARY = "SCAN_LIBRARY",
  ADD_FAVORITE = "ADD_FAVORITE",
  UPDATE_FAVORITE = "UPDATE_FAVORITE",
  REMOVE_FAVORITE = "REMOVE_FAVORITE",
  CREATE_FILE_CURSOR = "CREATE_FILE_CURSOR",
  CREATE_FAVORITE_CURSOR = "CREATE_FAVORITE_CURSOR",
  UPDATE_LIBRARY = "UPDATE_LIBRARY",
}

interface ScanLibraryMessage {
  type: SoundFontLibraryMessageTypes.SCAN_LIBRARY;
}

interface AddFavoriteMessage {
  type: SoundFontLibraryMessageTypes.ADD_FAVORITE;
  favorite: Favorite;
}

interface CreateFileCursorMessage {
  type: SoundFontLibraryMessageTypes.CREATE_FILE_CURSOR;
  sender: Ref<Cursor<SoundFontFile>>;
}

interface CreateFavoriteCursorMessage {
  type: SoundFontLibraryMessageTypes.CREATE_FAVORITE_CURSOR;
  sender: Ref<Cursor<Favorite>>;
}

interface RemoveFavoriteMessage {
  type: SoundFontLibraryMessageTypes.REMOVE_FAVORITE;
  favorite: CollectionItem<Favorite>;
  sender: Ref<typeof OPERATION_SUCCESS>;
}

type SoundFontLibraryMessage =
  | ScanLibraryMessage
  | AddFavoriteMessage
  | RemoveFavoriteMessage
  | CreateFileCursorMessage
  | CreateFavoriteCursorMessage;

export interface SoundFontLibraryState {
  files: Collection<SoundFontFile>;
  favorites: Collection<Favorite>;
}

export interface Favorite {
  filename: string;
  instrument: number;
  bank: number;
  displayName: string;
}

export interface File {
  filename: string;
  displayName: string;
}
