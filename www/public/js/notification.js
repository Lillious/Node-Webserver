export default function Notification(type, message) {
	const container = document.getElementById("container") || document.getElementById("container-login") || document.getElementById("container-register");
	if (!container) return;
	const notification = document.createElement("div");
	notification.classList.add("notification");
	notification.classList.add(type);
	notification.innerHTML = `<p>${message}</p>`;
	container.appendChild(notification);

	// Move the notification up if there are other notifications
	const notifications = document.getElementsByClassName("notification");
	for (let i = 0; i < notifications.length; i++) {
		notifications[i].style.marginBottom = `${80 * i}px`;
	}

	setTimeout(() => {
		// Move all notifications up
		const notifications = document.getElementsByClassName("notification");
		for (let i = 0; i < notifications.length; i++) {
			notifications[i].style.marginBottom = `${80 * (i - 1)}px`;
		}
		notification.remove();
	}, 5000);
}