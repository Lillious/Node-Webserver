function addRedirect() {
	const panel = document.getElementById("info-panel");
	const url = document.getElementById("redirect-url").value.replace(/\/$/, '');
	const destination = document.getElementById("redirect-destination").value.replace(/\/$/, '');
	fetch("/api/redirect-rule", {
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
		if (res.status !== 200) {
			window.Notification("error", `Failed to add redirect for ${url}/`);
			return;
		}
		panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p class="clickable" onclick="window.open('https://${destination}')">${url}/ -> ${destination}/</p><div class="list-item-remove" onclick="removeRedirect('${url}/ -> ${destination}/');">✕</div></div></div>`
		document.getElementById("redirect-url").value = "";
		document.getElementById("redirect-destination").value = "";
		window.Notification("success", `Redirect added for ${url}/`);
	}).catch(err => {
		window.Notification("error", `Failed to add redirect for ${url}/`);
	})
}