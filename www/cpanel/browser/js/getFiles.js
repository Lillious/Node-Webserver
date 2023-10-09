(function() {
	const button = document.getElementById("upload-file-input");
	const label = document.getElementById("upload-file-label");
	if (button) {
		button.style.display = "none";
	}
	if (label) {
		label.style.display = "none";
	}
	const panel = this.window.document.getElementById("info-panel")
	panel.innerHTML += `<p class="loading"></p>`
	if (panel) {
		fetch("/api/file", {
			method: "GET",
			headers: {
				"Content-Type": "application/json"
			},
			cache: "no-cache"
		}).then(res => {
			if (res.status === 200) {
				res.json().then(data => {
					if (data.length === 0) {
						panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p class="info">No files found</p></div></div>`
					} else {
						for (let i = 0; i < data.length; i++) {
							if (data[i] !== "") {
								panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p class="fileName clickable" onclick="window.open('/files/${data[i].name}')">${data[i].name}</p><p class="fileSize">${data[i].size}</p><div class="list-item-remove" onclick="removeFile('${data[i].name}');">✕</div></div></div>`
							}
						}
					}
				})
			} else {
				panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p class="info">Failed to get files</p></div></div>`
			}
		}).finally(() => {
			const loading = panel.getElementsByClassName("loading");
			loading[0].remove();
		})
	}
})()