(function() {
  const logout = this.window.document.getElementById("logout")
  if (logout) {
    logout.addEventListener("click", () => {
      fetch("/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        cache: "force-cache"
      })
        .then(res => {
          if (res.status === 200) {
            this.window.location.href = "/login"
          }
        })
        .catch(err => {
          console.error(err)
        })
    })
  }
})()