(function() {
	const version = this.document.getElementById("breadcrumbs");
	if (version && version.classList.contains("version")) {
		fetch("/api/version", {
			method: "GET",
			headers: {
				"Content-Type": "application/json"
			},
			cache: "no-cache"
		}).then(res => {
			if (res.status === 200) {
				res.json().then(data => {
					version.innerHTML = `v${data.version}`
				})
			} else {
				version.innerHTML = "Failed to get version"
			}
		})
	}
})()