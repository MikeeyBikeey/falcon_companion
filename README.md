# Falcon Companion
The College of Eastern Idaho's mascot, Franky the Falcon, flying through Google Chrome.\
⚠️This project is in early development⚠️\
![Falcon Companion Exploring Wikipedia](/media/falcon_companion.gif)\
Summon the help of Franky to explore the web.

## How to Explore
Press the extension icon and then press Franky in the popup.\
![Example Screenshot](/media/popup_example.png)
### Controls
* Jump: `W`
* Walk: `A` and `D`
* Run: `Shift` or `Space`
* Crouch/Enter Hyperlink: `S`
* Debug: `P`

## Installation
This project is a Google Chrome Extension. However, since this project is not on the Google Play Store, some extra steps are required for installation.
1. [Download the latest release](https://github.com/MikeeyBikeey/falcon_companion/releases/latest/download/falcon_companion.zip) from the releases page.
2. Extract the downloaded file.
3. Open Chrome and navigate to the [Chrome Extensions page](chrome://extensions/).
4. Enable `Developer mode` in the upper right hand side.
5. Press `Load unpacked` and select the extracted folder from step 2.

Take to the sky! Franky should be ready to go.

## Build Instructions
The Godot game is placed in the root [godot](/godot) directory. The Chrome extension is placed in the root [extension](/extension) directory.

To make changes to the game and have the browser reflect them, the Godot game must be exported to the file location `extension/game.pck` as a `pck` file with the `HTML` export.
Refreshing any already-existing web pages should reflect changes to the game. There is no need to refresh the extension itself.

## Known Issues
The web is a weird place. It is hard to account for every way a website can be configured.\
Franky can be missing if the website prevents the Godot Engine scripts from compiling the `wasm` file.\
Franky can appear to float (sometimes) if there is hidden text.\
Franky can straight up phase through text if the text is an image or detected as transparent.\
Franky can also experience lag and slowness if the webpage is too much for the computer, likely too many ads.

Looking for a reliable place to explore? [Wikipedia.org](https://www.wikipedia.org/) is a great place to explore with Franky.

## How does it work?
This project is a [Google Chrome Extension](https://developer.chrome.com/docs/extensions/) and a [Godot](https://godotengine.org/) game bundled together.\
Essentially, this is a Google Chrome Extension (Manifest V3) that leverages the [Godot 3.5 HTML export](https://docs.godotengine.org/en/3.5/tutorials/export/exporting_for_web.html) for the game.

The Godot Engine scripts are located at [`extension/scripts/godot.js`](/extension/scripts/godot.js) (with modifications) and [`extension/scripts/godot.wasm`](/extension/scripts/godot.wasm), and the game pack is located at `extension/game.pck` (excluded from version control; read [build instructions](#build-instructions)).

### License
Licensed under the [MIT license](./LICENSE).
