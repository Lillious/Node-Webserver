(function() {
	const panel = this.window.document.getElementById("info-panel")
	panel.innerHTML += `<p class="loading"></p>`
	if (panel) {
		fetch("/api/redirect-rule", {
			method: "GET",
			headers: {
				"Content-Type": "application/json"
			},
			cache: "no-cache"
		}).then(res => {
			if (res.status === 200) {
				res.json().then(data => {
					if (data.length === 0) {
						panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p>No redirects found</p></div></div>`
					} else {
						for (let i = 0; i < data.length; i++) {
							if (data[i] !== "") {
								// Split the redirect into the URL and the destination
								const redirect = data[i].split(" -> ")
								panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p class="clickable" onclick="window.open('https://${redirect[1]}')">${data[i]}</p><div class="list-item-remove" onclick="removeRedirect('${data[i]}');">✕</div></div></div>`
							}
						}
					}
				})
			} else {
				panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p>Failed to get redirects</p></div></div>`
			}
		}).finally(() => {
			const loading = panel.getElementsByClassName("loading");
			loading[0].remove();
		})
	}
})()