(function() {
    const logout = document.getElementById('logout');
    if (logout) {
        logout.addEventListener('click', () => {
            fetch('/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    cache: 'force-cache',
                })
                .then((res: any) => {
                    if (res.status === 200) {
                        window.location.href = '/login';
                    }
                })
                .catch((err: any) => {
                    console.error(err);
                });
        });
    }
})();