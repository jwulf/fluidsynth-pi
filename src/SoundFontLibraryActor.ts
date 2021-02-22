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
    .map((f) => ({
      filename: f,
      displayName: f.replace(".sf2", ""),
      instrument: 0,
      bank: 0,
    }));
  return soundFontFiles;
}

function readFavorites(): SoundFontEntry[] {
  const libFile = getLibraryFilePath();
  const libFileExists = fs.existsSync(libFile);
  return libFileExists ? require(libFile) : [];
}

function writeFavorites(library: Collection<SoundFontEntry>) {
  const libFile = getLibraryFilePath();
  fs.writeFileSync(libFile, JSON.stringify(library.getItems, null, 2));
}

function getLibraryFilePath() {
  return path.join(__dirname, "..", "soundfonts", "soundfontLibrary.json");
}

export function fontExists(filename: string) {
  const fontFile = path.join(__dirname, "..", "soundfonts", filename);
  console.log(`Checking for ${fontFile}`);
  return fs.existsSync(fontFile);
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
  favorite: SoundFontEntry;
}

interface CreateFileCursorMessage {
  type: SoundFontLibraryMessageTypes.CREATE_FILE_CURSOR;
  sender: Ref<Cursor<SoundFontEntry>>;
}

interface CreateFavoriteCursorMessage {
  type: SoundFontLibraryMessageTypes.CREATE_FAVORITE_CURSOR;
  sender: Ref<Cursor<SoundFontEntry>>;
}

interface RemoveFavoriteMessage {
  type: SoundFontLibraryMessageTypes.REMOVE_FAVORITE;
  favorite: CollectionItem<SoundFontEntry>;
  sender: Ref<typeof OPERATION_SUCCESS>;
}

type SoundFontLibraryMessage =
  | ScanLibraryMessage
  | AddFavoriteMessage
  | RemoveFavoriteMessage
  | CreateFileCursorMessage
  | CreateFavoriteCursorMessage;

export interface SoundFontLibraryState {
  files: Collection<SoundFontEntry>;
  favorites: Collection<SoundFontEntry>;
}

export interface SoundFontEntry {
  filename: string;
  instrument: number;
  bank: number;
  displayName: string;
}

export interface File {
  filename: string;
  displayName: string;
}
