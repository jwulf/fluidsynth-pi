# Fluidsynth for Raspberry Pi

An application that provides an LCD and rotary dial interface for Fluidsynth on Raspberry Pi with the appropriate hardware.

## Cursors

FileCursors are cursors into the soundfont files.
EntryCursors are cursors into the "Favorites" entries.

FontCursors are cursors into the instruments in a fontfile.

When a new cursor is created, it is initialised to 0, the first element in the collection.
If the collection has a zero-length, then the cursor index is set to -1.


## Menu structure

Opens with Favorites.

- "Favorites" - Fontfile/bank/instrument combo entries
    - Scrolling up and down selects, clicking selects.
    - if you click without scrolling, nothing is selected, it goes to the next menu 

- Next menu 
    - Edit (only if a favorite is selected - not if Empty)
    - Fonts
    - Restart Synth
    - Shutdown
    - Exit (takes you back to Favorites)

- Edit
    - Delete
    - Rename

- Fonts 
    - List all font files and let them scroll through
    - 