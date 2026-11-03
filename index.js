const { Popup, POPUP_TYPE, POPUP_RESULT, extensionSettings } = SillyTavern.getContext();

const MODULE_NAME = "nateyg_guidenext"


const defaultSettings = Object.freeze({
    enabled: false
});

function getSettings() {
    if (!extensionSettings[MODULE_NAME]) {
        extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
    }

    // Update fields if they don't exist (for updates and such)
    for (const key of Object.keys(defaultSettings)) {
        if (!Object.hasOwn(extensionSettings[MODULE_NAME], key)) {
            extensionSettings[MODULE_NAME][key] = defaultSettings[key];
        }
    }

    return extensionSettings[MODULE_NAME];
}

globalThis.guideNextInterceptor = async function(chat, contextSize, abort, type) {
    const popup = new Popup(
        '<div>Enter guidance</div>',
        POPUP_TYPE.INPUT,
        'For the next message: ',
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
        toastr.error("Message cannot be empty.");
        abort(true);
        return;
    }

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