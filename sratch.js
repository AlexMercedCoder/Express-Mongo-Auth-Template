const response = await fetch("/todos", {
    method: "get",
    headers: {
        Authorization: `bearer ${token}`
    }
})