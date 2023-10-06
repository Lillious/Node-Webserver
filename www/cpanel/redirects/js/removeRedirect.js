function removeRedirect(url) {
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

	window.popup(`Are you sure you want to remove the redirect<br>${url}?`, options).then((result) => {
		const container = document.getElementsByClassName("popup-container")[0];
		container.remove();
		if (result) {
			const split = url.split(" -> ")
			fetch("/api/redirect-rule", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					url: split[0]
				}),
				cache: "no-cache"
			}).then(res => {
				if (res.status !== 200) {
					window.Notification("error", `Failed to remove redirect ${url}`)
					return;
				}
				const list = this.window.document.getElementById("info-panel")
				if (list) {
					const items = list.getElementsByClassName("list-item-content")
					for (let i = 0; i < items.length; i++) {
						const item = items[i]
						const _url = item.getElementsByTagName("p")[0].innerHTML.replace(/-&gt;/g, "->")
						if (url === _url) {
							if (item.parentElement) {
								item.parentElement.remove()
								window.Notification("success", `Redirect ${url} was removed`)
								return;
							}
						}
					}
				}
			}).catch(err => {
				window.Notification("error", `Failed to remove redirect ${url}`)
			})
		}
	});
}