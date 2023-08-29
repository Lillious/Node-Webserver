(function() {
  const ip = this.window.document.getElementById("server-ip-text")
  const directory = this.window.document.getElementById("home-directory-text")
  const domain = this.window.document.getElementById("primary-domain-text")
  if (ip && directory && domain) {
    fetch("/api/serverinfo", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-cache"
    })
      .then(res => {
        if (res.status === 200) {
          res.json().then(data => {
            if (ip) ip.innerHTML = data.ip
            if (directory) directory.innerHTML = `${data.directory}/`
            if (domain) domain.innerHTML = `${data.protocol}://${data.domain}/`
          })
        }
      })
      .catch(err => {
        if (ip) ip.innerHTML = "Error"
        if (directory) directory.innerHTML = "Error"
        if (domain) domain.innerHTML = "Error"
        console.error(err)
      })
  }

  const fileSize = this.window.document.getElementById("file-size")
  if (fileSize) {
    fetch("/api/fileusage", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-cache"
    })
      .then(res => {
        if (res.status === 200) {
          res.json().then(data => {
            const total = data.total
            const free = data.free
            const used = total - free
            const percentage = Math.round((used / total) * 100)
            const bar = this.window.document.getElementById("file-size-bar")
            const _used = Math.round((used / 1e9) * 10) / 10
            const _total = Math.round((total / 1e9) * 10) / 10
            fileSize.innerHTML = `${_used} GB / ${_total} GB (${percentage}%)`
            if (bar) bar.style.width = `${percentage}%`
            if (percentage >= 50 && percentage < 90) {
              if (bar) bar.style.backgroundColor = "#f9a825"
            } else if (percentage >= 90) {
              if (bar) bar.style.backgroundColor = "#e74c3c"
            }
          })
        }
      })
      .catch(err => {
        if (fileSize) fileSize.innerHTML = "Error"
        console.error(err)
      })
  }

  const display_name = this.window.document.getElementById("display_name")
  if (display_name) {
    fetch("/api/@me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-cache"
    })
      .then(res => {
        if (res.status === 200) {
          res.json().then(data => {
            display_name.innerHTML = data.email
          })
        }
      })
      .catch(err => {
        console.error(err)
      })
  }
})()