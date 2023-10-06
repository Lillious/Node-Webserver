function removeIp(ip) {
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
	window.popup(`Are you sure you want to remove the ip<br>${ip}?`, options).then((result) => {
		const container = document.getElementsByClassName("popup-container")[0];
		container.remove();
		if (result) {
			fetch("/api/blocked-ip", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json"
				},
				cache: "no-cache",
				body: JSON.stringify({
					ip: ip
				})
			}).then(res => {
				if (res.status !== 200) {
					window.Notification("error", `Failed to remove IP ${ip}`)
					return;
				}

				const list = this.window.document.getElementById("info-panel")
				if (list) {
					const items = list.getElementsByClassName("list-item-content")
					for (let i = 0; i < items.length; i++) {
						const item = items[i]
						const _ip = item.getElementsByTagName("p")[0].innerHTML
						if (ip === _ip) {
							if (item.parentElement) {
								item.parentElement.remove()
								window.Notification("success", `IP ${ip} was removed`)
								return
							}
						}
					}
				}
			}).catch(err => {
				window.Notification("error", `Failed to remove IP ${ip}`)
			})
		}
	});
}