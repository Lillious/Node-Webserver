// self executing function here
(function() {
  const register = this.window.document.getElementById("register")
  if (register) {
    fetch("/register", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "force-cache"
    })
      .then(res => {
        if (res.status === 200) {
          register.style.display = "block"
        }
      })
      .catch(err => {
        console.error(err)
      })
  }
})()