// A canvas container is created to hide any overflow the canvas creates (Godot makes it overflow because it does not take the scrollbars into account)
const canvas_container = document.createElement('div');
const canvas = document.createElement('canvas');
let has_engine_started = false;

function initEngine() {
  resetGame();
  initCanvas();

  // GODOT

  const myWasm = chrome.runtime.getURL('scripts/godot');
  const myPck = chrome.runtime.getURL('game.pck');
  const engine = new Engine();
  Promise.all([
    engine.init(myWasm),
    engine.preloadFile(myPck),
  ]).then(() => {
    return engine.start({ "canvas": canvas, "args": ['--main-pack', myPck], "canvasResizePolicy": 2, "experimentalVK": false, "focusCanvas": true, "gdnativeLibs": [] });
  }).then(() => {
    // Engine has started
    canvas.style.position = "relative"; // "fixed" would normally work, but we want custom scroll-bar-following logic to avoid jittering (look at `game.onscroll`)
  });
}

// CANVAS

function initCanvas() {
  // Some aspects are based on the Godot source code for html template: "https://github.com/godotengine/godot/blob/master/misc/dist/html/full-size.html"
  const styles = `
  #canvas:focus {
    outline: none;
  }
  `;
  const styleTag = document.createElement('style');
  if (styleTag.styleSheet) {
    styleTag.styleSheet.cssText = styles;
  } else {
    styleTag.appendChild(document.createTextNode(styles));
  }
  document.getElementsByTagName('head')[0].appendChild(styleTag);

  canvas_container.style.overflow = "hidden";
  canvas_container.style.position = "absolute";
  canvas_container.style.left = '0px';
  canvas_container.style.top = '0px';
  canvas_container.style.width = '100%';
  canvas_container.style.height = '100%';
  canvas_container.style.pointerEvents = "none";
  document.body.append(canvas_container);

  canvas.id = "canvas"; // Hopefully the web page doesn't already have an element with the id "canvas"...
  canvas.style.position = "relative"; // "fixed" would normally work, but we want custom scroll-bar-following logic to avoid jittering (look at `game.onscroll`)
  canvas.style.left = '0px';
  canvas.style.top = '0px';
  canvas.style.width = "1px"; // `1px` for no particular reason
  canvas.style.height = "1px"; // `1px` for no particular reason
  canvas.style.display = "block";
  canvas.style.margin = "0";
  canvas.style.color = "white";
  canvas.style.zIndex = "99999"; // `99999` for no particular reason
  function on_focus_lost(e) {
    canvas.focus();
  }
  document.addEventListener('focusout', on_focus_lost);
  canvas_container.append(canvas);
}

// GAME

// Helper utility for interfacing with Godot.
// Keep this as a `var` so Godot can detect it in the global namespace.
var game = {};

function resetGame() {
  // The current level the player is on.
  // Increments by one with each level that is beaten.
  game.level = 0;

  game.node_rects = {};

  // For keeping references of elements in Godot.
  game.next_element_id = 0;

  game.enter_level = function (url) {
    chrome.runtime.sendMessage({ name: "change_level" });
    window.location.href = url;
    // chrome.runtime.sendMessage({ name: "open_level", url: url, level: game.level + 1 });
  };

  function getBoundingRectangle(node) {
    const range = document.createRange();
    // Selects everything on the inside of the element
    range.setStart(node, 0);
    range.setEndAfter(node);

    return range.getClientRects();
  }

  function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) && window.getComputedStyle(el).visibility !== "hidden";
  }

  function getParentHyperlinkLink(el) {
    if (el.parentElement === null) {
      return "";
    } else if (el.parentElement.tagName === "A") {
      return el.parentElement.href;
    } else {
      return getParentHyperlinkLink(el.parentElement);
    }
  }

  game.platform_inserted_callback = null;
  game.set_platform_inserted_callback = function (callback) {
    game.platform_inserted_callback = callback;

    let node = null;
    let texts = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    while (node = texts.nextNode()) {
      const rects = getBoundingRectangle(node);
      for (const rect of rects) {
        rect.x += window.scrollX;
        rect.y += window.scrollY;

        game.node_rects[node] = rect;
        if (node.parentElement !== null && isVisible(node.parentElement)) {

          // For keeping references of elements in Godot.
          if (!node.hasOwnProperty('godotObjectId')) {
            node.godotObjectId = game.next_element_id;
            game.next_element_id += 1;
            node.godotRect = rect;
          }

          var link = getParentHyperlinkLink(node)
          if (link === "") {
            game.platform_inserted_callback(node.godotObjectId, rect.x, rect.y, rect.width, rect.height);
          } else {
            game.hyperlink_inserted_callback(node.godotObjectId, rect.x, rect.y, rect.width, rect.height, link);
          }
        }
      }
    }
  };

  game.for_each_text_callback = null;
  game.for_each_text = function () {
    let node = null;
    let texts = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    while (node = texts.nextNode()) {
      const rects = getBoundingRectangle(node);
      for (const rect of rects) {
        rect.x += window.scrollX;
        rect.y += window.scrollY;

        if (node.hasOwnProperty('godotObjectId')) {
          const pre_rect = node.godotRect;
          if (pre_rect.x !== rect.x || pre_rect.y !== rect.y || pre_rect.width != rect.width || pre_rect.height != rect.height) {
            node.godotRect = rect;
            game.for_each_text_callback(node.godotObjectId, rect.x, rect.y, rect.width, rect.height);
          }
        }
      }
    }
  };

  game.hyperlink_inserted_callback = null;
  game.set_hyperlink_inserted_callback = function (callback) {
    game.hyperlink_inserted_callback = callback;

    // const cells = document.getElementsByTagName("a");
    // for (const cell of cells) {
    //   const rects = getBoundingRectangle(cell);
    //   for (const rect of rects) {
    //     if (isVisible(cell)) {
    //       callback(rect.x + window.scrollX, rect.y + window.scrollY, rect.width, rect.height, cell.href);
    //     }
    //   }
    // }
  };

  game.onscroll_callback = null;
  game.set_onscroll_callback = function (callback) {
    game.onscroll_callback = callback;
  };

  game.on_quit_request_callback = null;

  game.onscroll = function () {
    canvas_container.style.left = document.documentElement.scrollLeft + 'px';
    canvas_container.style.top = document.documentElement.scrollTop + 'px';
    if (game.onscroll_callback !== null) {
      game.onscroll_callback(document.documentElement.scrollLeft, document.documentElement.scrollTop);
    }
  };

  // Hopefully modifying `document.body.onscroll` won't lead to any issues with the web page...
  document.body.onscroll = game.onscroll;

  game.scroll_center_to = function (x, y) {
    window.scrollTo({ left: x - window.innerWidth / 2, top: y - window.innerHeight / 2, behavior: "instant" });
    game.onscroll(); // `onscroll` directly called here because it can take a whole frame for the `window` to notice the change
  }
}

// TODO: Observe changes made to the DOM

// {
//   // Select the node that will be observed for mutations
//   const targetNode = document;

//   // Options for the observer (which mutations to observe)
//   const config = { attributes: true, childList: true, subtree: true };

//   // Callback function to execute when mutations are observed
//   const callback = (mutationList, observer) => {
//     for (const mutation of mutationList) {
//       if (mutation.type === "childList") {
//         console.log("A child node has been added or removed.");
//       } else if (mutation.type === "attributes") {
//         console.log(`The ${mutation.attributeName} attribute was modified.`);
//       }
//     }
//   };

//   var observer = null;

//   // Create an observer instance linked to the callback function
//   observer = new MutationObserver(callback);

//   // Start observing the target node for configured mutations
//   observer.observe(targetNode, config);

//   // // Later, you can stop observing
//   // observer.disconnect();
// }

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.name === "has_engine_started") {
      sendResponse(has_engine_started);
    } else if (request.name === "start_engine") {
      if (!has_engine_started) {
        initEngine();
        has_engine_started = true;
      }
      game.level = request.level;
    } else if (request.name === "stop_engine") {
      if (game.on_quit_request_callback !== null) {
        document.body.removeChild(canvas_container);
        canvas_container.removeChild(canvas);
        game.on_quit_request_callback();
        resetGame();
        has_engine_started = false;
        sendResponse("game_stopped");
      }
      sendResponse("game_not_ready");
    }
  }
);
