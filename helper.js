const BATCH_SIZE = 300;

function getMessage(item) {
    return String(item?.message ?? item?.Message ?? "");
}

function getLevel(item) {
    return String(item?.level ?? item?.Level ?? "UNKNOWN").toUpperCase();
}

function getLoggedOn(item) {
    const value = item?.loggedOn ?? item?.LoggedOn ?? item?.timestamp ?? item?.Timestamp ?? item?.date ?? item?.Date ?? "";
    const text = String(value);
    return text.length >= 19 ? text.slice(0, 19).replace("T", " ") : text;
}

function toggleItem(target) {
    target.parentElement.classList.toggle("jsonHidden");
}

function truncate(text, maxLength) {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"'/`=]/g, function (ch) {
        return ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
            "/": "&#x2F;",
            "`": "&#x60;",
            "=": "&#x3D;"
        })[ch];
    });
}

function showLoader() {
    document.getElementById("overlay").style.display = "flex";
}

function hideLoader() {
    document.getElementById("overlay").style.display = "none";
}

function frame() {
    return new Promise(function (resolve) {
        requestAnimationFrame(resolve);
    });
}
