const { Popup, POPUP_TYPE, POPUP_RESULT, extensionSettings, saveSettingsDebounced } = SillyTavern.getContext();

const MODULE_NAME = "nateyg_guidenext";
let lastMessage = null;
const settings = initializeSettings();

function initializeSettings() {
    const defaultSettings = {
        enabled: false,
    };

    extensionSettings[MODULE_NAME] ??= {};

    const settings = extensionSettings[MODULE_NAME];

    for (const [key, value] of Object.entries(defaultSettings)) {
        if (!(key in settings)) {
            settings[key] = value;
        }
    }

    saveSettingsDebounced();

    return settings;
}

function addButton() {
    const enabledIcon = 'fa-solid fa-comment';
    const disabledIcon = 'fa-solid fa-comment-slash';

    const getIcon = () => settings.enabled ? enabledIcon : disabledIcon;

    const button = document.createElement('div');
    button.id = 'guideNextButton';
    button.classList.add('interactable');
    button.tabIndex = 0;
    button.title = 'Toggle GuideNext';

    const icon = document.createElement('i');
    icon.className = getIcon();
    button.appendChild(icon);

    const extensionsButton = document.getElementById('extensionsMenuButton');
    if (!extensionsButton) {
        throw new Error("Couldn't find extensionsMenuButton");
    }

    // Without this the button will get added before everything else for some reason
    button.style.order = getComputedStyle(extensionsButton).order;

    extensionsButton.insertAdjacentElement('afterend', button);
    button.addEventListener('click', () => {
        toggleEnabled();
        icon.className = getIcon();
    })
}

function toggleEnabled() {
    settings.enabled = !settings.enabled;
    saveSettingsDebounced();
}

globalThis.guideNextInterceptor = async function(chat, contextSize, abort, type) {
    if(!settings.enabled) {
        return;
    }

    if(type !== 'swipe' && type !== 'regenerate') {
        lastMessage = null;
    }

    const defaultValue = lastMessage ?? '';

    const popup = new Popup(
        '<div>Enter guidance</div>',
        POPUP_TYPE.INPUT,
        defaultValue,
        {
            wide: true,
            rows: 10,
            okButton: "Save",
            cancelButton: "Discard",
            customButtons: [
                {
                    text: "Cancel generation",
                    result: POPUP_RESULT.CANCELLED,
                    action: async () => {
                        await abort(true);
                        await popup.complete(POPUP_RESULT.CANCELLED);
                    },
                    appendAtEnd: true
                }
            ]
        }
    );

    const result = await popup.show();

    if(!result) {
        return;
    }

    const value = popup.value;
    if(value.trim() === ''){
        toastr.info("Empty GuideNext message ignored.");
        return;
    }

    lastMessage = value;
    chat.push({
        is_user: false,
        name: "System Note",
        send_date: Date.now(),
        mes: value,
        extra: {
            type: "narrator"
        }
    });
}

function init() {
    addButton();
}

init();