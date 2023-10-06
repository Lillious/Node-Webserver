const register = document.getElementById("register-btn");
register.addEventListener("click", () => {
	fetch("/registration", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			email: document.getElementById("email").value,
			password: document.getElementById("password").value,
			password2: document.getElementById("password2").value
		}),
		cache: "no-cache"
	}).then(res => {
		if (res.status !== 200) {
			window.Notification("error", "An error occurred while creating the account");
			return;
		}
		window.Notification("success", "Account created successfully");
		setTimeout(() => {
			location.href = "/login/2fa.html";
		}, 2000);
	}).catch(err => {
		window.Notification("error", "Internal server error");
	});
});