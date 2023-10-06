function createPopup (message, options) {
    const container = document.createElement("div");
    container.classList.add("popup-container");

    const title = document.createElement("div");
    title.classList.add("popup-title");
    title.innerHTML = `<p>${options.title}</p>`;

    const content = document.createElement("div");
    content.classList.add("popup-content");
    content.innerHTML = `<p>${message}</p>`;

    const popup = document.createElement("div");
    popup.classList.add("popup");

    const buttons = document.createElement("div");
    buttons.classList.add("popup-buttons");

    for (const button in options.buttons) {
        const buttonElement = document.createElement("button");
        buttonElement.innerHTML = button;
        buttonElement.type = "button";
        buttons.appendChild(buttonElement);
    }

    popup.appendChild(title);
    popup.appendChild(content);
    popup.appendChild(buttons);
    document.body.appendChild(container);
    container.appendChild(popup);
    return container;
}


export default function popup (message, options) {
    options.title = options.title || "Popup";
    options.type = options.type || "info";
    options.buttons = options.buttons || {
        "OK": function () {
            console.log("OK");
        }
    };

    createPopup(message, options);

    return new Promise((resolve, reject) => {
        const buttons = document.getElementsByClassName("popup-buttons");
        for (const button of buttons) {
            button.addEventListener("click", function (event) {
                const button = event.target;
                const buttonName = button.innerHTML;
                const result = options.buttons[buttonName]();
                resolve(result);
            });
        }
    });
}