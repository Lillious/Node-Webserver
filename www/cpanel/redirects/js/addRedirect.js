function addRedirect() {
    const panel = this.window.document.getElementById("info-panel");
    const url = this.document.getElementById("redirect-url").value.replace(/\/$/, '');
    const destination = this.document.getElementById("redirect-destination").value.replace(/\/$/, '');
    fetch("/api/add-redirect", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            url: url,
            redirect: destination
        }),
        cache: "no-cache"
    }).then(res => {
        if (res.status !== 200) return;
        panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p>${url}/ -> ${destination}/</p><div class="list-item-remove" onclick="removeRedirect('${url}/ -> ${destination}/');">✕</div></div></div>`
        this.document.getElementById("redirect-url").value = "";
        this.document.getElementById("redirect-destination").value = "";
    });
}