const reset = document.getElementById('password-reset');
reset.addEventListener('click', () => {
	// Fetch /api/reset-password
	fetch('/api/reset-password', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			temppassword: document.getElementById('temppassword').value,
			password1: document.getElementById('password1').value,
			password2: document.getElementById('password2').value
		}),
		cache: 'no-cache'
	}).then(res => {
		if (res.status !== 200) {
			window.Notification('error', 'An error occurred while resetting the password');
			return;
		}
		window.Notification('success', 'Password reset successfully');
		setTimeout(() => {
			location.href = '/login';
		}, 2000);
	}).catch(err => {
		window.Notification('error', 'Internal server error');
	});
});