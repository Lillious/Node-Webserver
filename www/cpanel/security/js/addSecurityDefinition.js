function addSecurityRule() {
	const panel = document.getElementById("info-panel");
	const rule = document.getElementById("rule").value;
	fetch("/api/security-definition", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			rule
		}),
		cache: "no-cache"
	}).then(res => {
		if (res.status !== 200) {
			window.Notification("error", `Failed to add security definition ${rule}`);
			return;
		}
		panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p>${rule}</p><div class="list-item-remove" onclick="removeSecurityDefinition('${rule}');">✕</div></div></div>`
		document.getElementById("rule").value = "";
		window.Notification("success", `Security definition ${rule} added`);
	}).catch(err => {
		window.Notification("error", `Failed to add security definition ${rule}`);
		console.error(err);
	})
}