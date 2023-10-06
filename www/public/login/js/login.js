const login = document.getElementById("login");
login.addEventListener("click", () => {
	fetch("/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			email: document.getElementById("email").value,
			password: document.getElementById("password").value
		}),
		cache: "no-cache"
	}).then(res => {

		if (res.status === 403) {
			location.href = "/login/passwordreset.html";
			return;
		}

		if (res.status !== 200) {
			window.Notification("error", "Invalid email or password");
			return;
		}
		location.href = "/login/2fa.html";
	}).catch(err => {
		window.Notification("error", "Internal server error");
	});
});