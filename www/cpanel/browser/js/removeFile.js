function removeFile(file) {
	const options = {
		title: "Confirmation",
		type: "info",
		buttons: {
			"Yes": function() {
				return true;
			},
			"No": function() {
				return false;
			}
		}
	};

	window.popup(`Are you sure you want to remove<br>${file}?`, options).then((result) => {
		const container = document.getElementsByClassName("popup-container")[0];
		container.remove();
		if (result) {
			fetch("/api/file", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json"
				},
				cache: "no-cache",
				body: JSON.stringify({
					file: file
				})
			}).then(res => {
				if (res.status !== 200) {
					window.Notification("error", `Failed to remove file ${file}`)
					return;
				}

				const list = this.window.document.getElementById("info-panel")
				if (list) {
					const items = list.getElementsByClassName("list-item-content")
					for (let i = 0; i < items.length; i++) {
						const item = items[i]
						const _file = item.getElementsByTagName("p")[0].innerHTML
						if (file === _file) {
							if (item.parentElement) {
								item.parentElement.remove()
								window.Notification("success", `File ${file} was removed`)
								return
							}
						}
					}
				}

				if (res.status === 201) {
					// Files directory is empty, reload page to show no files
					this.window.location.reload()
				} else if (res.status === 404) {
					this.window.location.reload()
				}
			}).finally(() => {
				const panel = document.getElementById("info-panel");
				if (panel) {
					const items = panel.getElementsByClassName("list-item-content")
					if (items.length === 0) {
						panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p class="info">No files found</p></div></div>`
					}
				}
			})
		}
	})
}