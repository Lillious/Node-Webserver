function removeUser(email) {
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

	window.popup(`Are you sure you want to remove the user<br>${email}?`, options).then((result) => {
		const container = document.getElementsByClassName("popup-container")[0];
		container.remove();
		if (result) {
			fetch("/api/user", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json"
				},
				cache: "no-cache",
				body: JSON.stringify({
					email: email
				})
			}).then(res => {
				if (res.status !== 200) {
					window.Notification("error", `Failed to remove user ${email}`)
					return;
				}

				const list = this.window.document.getElementById("info-panel")
				if (list) {
					const items = list.getElementsByClassName("list-item-content")
					for (let i = 0; i < items.length; i++) {
						const item = items[i]
						const _email = item.getElementsByTagName("p")[0].innerHTML
						if (email === _email) {
							if (item.parentElement) {
								item.parentElement.remove()
								window.Notification("success", `User ${email} was removed`)
								return
							}
						}
					}
				}
			}).finally(() => {
				const panel = document.getElementById("info-panel");
				if (panel) {
					const items = panel.getElementsByClassName("list-item-content")
					if (items.length === 0) {
						panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p class="info">No users found</p></div></div>`
					}
				}
			})
		}
	});
}