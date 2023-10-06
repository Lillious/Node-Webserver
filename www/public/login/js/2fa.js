const send = document.getElementById('2fa-send');
const resend = document.getElementById('2fa-resend');

send.addEventListener('click', () => {
	fetch('/2fa', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			code: document.getElementById('code').value
		}),
		cache: 'no-cache'
	}).then(res => {
		if (res.status !== 200) {
			window.Notification('error', 'Invalid code');
			return;
		} else {
			location.href = '/cpanel';
		}
	}).catch(err => {
		window.Notification('error', 'Internal server error');
	});
});

resend.addEventListener('click', () => {
	fetch('/2fa/resend', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({}),
		cache: 'force-cache'
	}).then(res => {
		if (res.status != 200) {
			window.Notification('error', 'Internal server error');
			return;
		} else {
			window.Notification('success', 'Code resent');
		}
	}).catch(err => {
		window.Notification('error', 'Internal server error');
	});
});