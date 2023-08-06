(function() {
    const register = document.getElementById('register');
    if (register) {
        fetch('/register', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'force-cache',
        })
        .then((res: any) => {
            if (res.status === 200) {
                register.style.display = 'block';
            }
        })
        .catch((err: any) => {
            console.error(err);
        });
    }
})();