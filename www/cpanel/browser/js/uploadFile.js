const upload = document.getElementById("upload-file-input");
upload.onchange = () => {
	const file = upload.files[0];
	createForm(file);
}

function createForm(file) {
	const form = new FormData();
	form.append("file", file);
	UploadFile(form);
}
// Upload file with progress console.log with post path of /api/upload
function UploadFile(form) {
	const xhr = new XMLHttpRequest();
	xhr.open("POST", "/api/file");
	window.Notification("success", `Uploading file ${upload.files[0].name}`);
	xhr.upload.onprogress = (e) => {
		if (e.lengthComputable) {
			const progress = document.getElementById("progress-bar-fill");
			const percent = (e.loaded / e.total) * 100;
			progress.style.width = `${percent}%`;
		}
	}
	xhr.onloadend = () => {
		const progress = document.getElementById("progress-bar-fill");
		progress.addEventListener("transitionend", () => {
			progress.style.width = "0%";
			upload.value = "";
		})

		
		const fileName = upload.files[0].name;
		if (xhr.status !== 200) {
			progress.addEventListener("transitionend", () => {
				if (this.animated) return;
				this.animated = true;
				window.Notification("error", `Failed to upload file ${fileName}`);
			})
			return;
		} else {
			progress.addEventListener("transitionend", () => {
				if (this.animated) return;
				this.animated = true;
				window.Notification("success", `Uploaded file ${fileName}`);
			})
		}

		setTimeout(() => {
			const panel = document.getElementById("info-panel");
			const items = document.getElementsByClassName("list-item");
			var itemsCopy = [...items];
			for (const item of itemsCopy) {
				item.remove();
			}

			itemsCopy = null;

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
							panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p>No files found</p></div></div>`
						} else {
							for (let i = 0; i < data.length; i++) {
								if (data[i] !== "") {
									// Check if it already exists in the list before adding it
									const items = document.getElementsByClassName("fileName");
									for (const item of items) {
										if (item.innerText === data[i].name) {
											return;
										}
									}
									panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p class="fileName clickable" onclick="window.open('/files/${data[i].name}')">${data[i].name}</p><p class="fileSize">${data[i].size}</p><div class="list-item-remove" onclick="removeFile('${data[i].name}');">✕</div></div></div>`
								}
							}
						}
					})
				} else {
					panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p>Failed to get files</p></div></div>`
				}
			})
		}, 2000);
	}

xhr.upload.onerror = () => {
	const progress = document.getElementById("progress-bar-fill");
	// Set background color to red
	progress.style.backgroundColor = "#FF4B4B";
	progress.addEventListener("transitionend", () => {
		progress.style.width = "0%";
		progress.style.backgroundColor = "#1EB980";
	})
}

	xhr.send(form);
}