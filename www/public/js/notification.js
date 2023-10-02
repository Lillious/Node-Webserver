export default function Notification (type, message) {
    const container = document.getElementById("container") || document.getElementById("container-login") || document.getElementById("container-register");
    if (!container) return;
    const notification = document.createElement("div");
    notification.classList.add("notification");
    notification.classList.add(type);
    notification.innerHTML = `<p>${message}</p>`;
    container.appendChild(notification);

    // Move the notification down if there are other notifications
    notification.style.marginTop = `${80 * document.getElementsByClassName('notification').length}px`;

    setTimeout(() => {
        // Move all notifications up
        const notifications = document.getElementsByClassName("notification");
        for (let i = 0; i < notifications.length; i++) {
            notifications[i].style.marginTop = `${80 * i}px`;
        }
        notification.remove();
    }, 5000);
}