// Starts the game in the currently active tab by sending a message to it.
async function sendStartMessage() {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    await chrome.runtime.sendMessage({ name: "start_game", tab_id: tab.id });
}

// Stops the game in the currently active tab by sending a message to it.
async function sendStopMessage() {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    let response = await chrome.tabs.sendMessage(tab.id, { name: "stop_engine", tab_id: tab.id });
    if (response === "game_stopped") {
        chrome.action.setIcon({ tabId: tab.id, path: { '16': '/icons/icon-16.png', '32': '/icons/icon-32.png', '48': '/icons/icon-48.png', '128': '/icons/icon-128.png' } });
    }
    return response;
}

async function hasEngineStarted() {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return await chrome.tabs.sendMessage(tab.id, { name: "has_engine_started" });
}

// Animates the character entering the webpage

hasEngineStarted().then((has_engine_started) => {
    let character_entered = has_engine_started;
    if (character_entered !== true) {
        character_entered = false;
    }

    let animation_state = "idle";
    const character = document.getElementById("character");

    // Handles the input

    document.body.onclick = () => {
        if (character_entered) {
            sendStopMessage().then((response) => {
                if (response === "game_stopped") {
                    character_entered = false;
                    animation_state = "entering";
                }
            });
        } else {
            character_entered = true;
            var audio = new Audio(chrome.runtime.getURL('popup/jump.wav'));
            audio.volume = 0.1;
            audio.play();
            sendStartMessage();
            animation_state = "exiting";
        }
    };

    // Handles the animation

    const jump_height = -32;
    const stand_height = 128;
    const character_y = stand_height;

    let y = character_y;

    if (character_entered) {
        y = jump_height;
        character.style.top = `${y}px`;
    }

    setInterval(() => {
        if (animation_state === "entering") {
            y += 1.8;
            character.style.top = `${y}px`;
            if (y > stand_height) {
                y = stand_height;
                animation_state = "idle";
            }
        } else if (animation_state === "exiting") {
            y -= 1.8;
            character.style.top = `${y}px`;
            if (y < jump_height) {
                y = jump_height;
                animation_state = "idle";
            }
        }

        // Does the jump sprite
        if (animation_state === "idle" || (y === stand_height && character.src !== "./character.png")) {
            character.src = "./character.png";
        } else if (y !== stand_height && character.src !== "./character_jump.png") {
            character.src = "./character_jump.png";
        }
    }, 1);
})

// Animates the background cloud

{
    const cloud = document.getElementById("cloud");
    const popup_width = 192;
    const cloud_width = 96;
    const extra_margin = cloud_width;
    let x = Math.random() * (popup_width + cloud_width + extra_margin) - cloud_width;

    cloud.style.left = `${x}px`;
    cloud.style.top = `${Math.random() * 48 - 16}px`;

    setInterval(() => {
        x += 0.1;
        cloud.style.left = `${x}px`;
        if (x > popup_width + extra_margin) {
            x = -cloud_width;
            cloud.style.top = `${Math.random() * 48 - 16}px`;
        }
    }, 1);
}
