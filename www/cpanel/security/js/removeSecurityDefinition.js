function removeSecurityDefinition(rule) {
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
	window.popup(`Are you sure you want to remove the security definition<br>${rule}?`, options).then((result) => {
		const container = document.getElementsByClassName("popup-container")[0];
		container.remove();
		if (result) {
			fetch("/api/security-definition", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json"
				},
				cache: "no-cache",
				body: JSON.stringify({
					rule
				})
			}).then(res => {
				if (res.status !== 200) {
					window.Notification("error", `Failed to remove security definition ${rule}`)
					return;
				} else {
					const list = this.window.document.getElementById("info-panel")
					if (list) {
						const items = list.getElementsByClassName("list-item-content")
						for (let i = 0; i < items.length; i++) {
							const item = items[i]
							const _rule = item.getElementsByTagName("p")[0].innerHTML
							if (rule === _rule) {
								if (item.parentElement) {
									item.parentElement.remove()
									window.Notification("success", `Security definition ${rule} was removed`)
									return
								}
							}
						}
					}
				}
			}).finally(() => {
				const panel = document.getElementById("info-panel");
				if (panel) {
					const items = panel.getElementsByClassName("list-item-content")
					if (items.length === 0) {
						panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p class="info">No security definitions found</p></div></div>`
					}
				}
			})
		}
	});
}