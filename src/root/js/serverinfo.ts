(function() {
    const serverinfo = document.getElementById('info-panel');
    const ip = document.getElementById('server-ip-text');
    const directory = document.getElementById('home-directory-text');
    const domain = document.getElementById('primary-domain-text');
    if (serverinfo) {
        fetch('/api/serverinfo', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-cache',
            })
            .then((res: any) => {
                if (res.status === 200) {
                    res.json().then((data: any) => {
                        if (ip) ip.innerHTML = data.ip;
                        if (directory) directory.innerHTML = `${data.directory}/`;
                        if (domain) domain.innerHTML = `${data.protocol}://${data.domain}/`;
                    });
                }
            })
            .catch((err: any) => {
                if (ip) ip.innerHTML = 'Error';
                if (directory) directory.innerHTML = 'Error';
                if (domain) domain.innerHTML = 'Error';
                console.error(err);
            });
    }

    const fileSize = document.getElementById('file-size');
    if (fileSize) {
        fetch('/api/fileusage', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-cache',
            })
            .then((res: any) => {
                if (res.status === 200) {
                    res.json().then((data: any) => {
                        const total = data.total;
                        const free = data.free;
                        const used = total - free;
                        const percentage = Math.round((used / total) * 100);
                        const bar = document.getElementById('file-size-bar');
                        const _used = Math.round((used / 1e+9) * 10) / 10
                        const _total = Math.round((total / 1e+9) * 10) / 10
                        fileSize.innerHTML = `${_used} GB / ${_total} GB (${percentage}%)`;
                        if (bar) bar.style.width = `${percentage}%`;
                        if (percentage >= 75 && percentage < 90) {
                            if (bar) bar.style.backgroundColor = '#f9a825';
                        } else if (percentage >= 90) {
                            if (bar) bar.style.backgroundColor = '#e74c3c';
                        }
                    });
                }
            })
            .catch((err: any) => {
                if (fileSize) fileSize.innerHTML = 'Error';
                console.error(err);
            });
    }
})();