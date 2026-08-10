let wholeJson = [];
let selectedFileName = "";

const elements = {
    fileInput: document.getElementById("fileInput"),
    filterLevel: document.getElementById("filterLevel"),
    filterMessage: document.getElementById("filterMessage"),
    filterMessage2: document.getElementById("filterMessage2"),
    filterButton: document.getElementById("filterButton"),
    tableContainer: document.getElementById("tableContainer"),
    overlay: document.getElementById("overlay")
};

elements.fileInput.addEventListener("change", handleFileChange);
elements.filterLevel.addEventListener("change", filterLogs);
elements.filterButton.addEventListener("click", filterLogs);

document.querySelectorAll("#filterMessage, #filterMessage2").forEach(function (input) {
    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            filterLogs();
        }
    });
});

async function handleFileChange(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    selectedFileName = file.name;
    wholeJson = [];
    showLoader();

    try {
        const extension = getFileExtension(file.name);

        if (extension === "zip") {
            await readFromZip(file);
        } else {
            await readFromFile(file);
        }

        elements.filterButton.disabled = false;
        createTable(wholeJson);
    } catch (error) {
        console.error(error);
        elements.tableContainer.innerHTML =
            '<div class="emptyState">Error while loading file:<br><strong>' +
            escapeHtml(error.message || String(error)) +
            "</strong></div>";
    } finally {
        hideLoader();
    }
}

function getFileExtension(fileName) {
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1) {
        return "";
    }
    return fileName.slice(lastDotIndex + 1).toLowerCase();
}

async function readFromFile(file) {
    const contents = await file.text();
    wholeJson.push(...parseLogContents(contents));
}

async function readFromZip(file) {
    const zip = await JSZip.loadAsync(file);
    const files = [];

    zip.forEach(function (_relativePath, zipEntry) {
        if (!zipEntry.dir) {
            files.push(zipEntry);
        }
    });

    if (files.length === 0) {
        throw new Error("ZIP file does not contain any files.");
    }

    for (const zipEntry of files) {
        const extension = getFileExtension(zipEntry.name);

        if (extension !== "json" && extension !== "log" && extension !== "txt") {
            continue;
        }

        const contents = await zipEntry.async("string");
        wholeJson.push(...parseLogContents(contents));
    }

    if (wholeJson.length === 0) {
        throw new Error("ZIP file does not contain readable JSON, LOG, or TXT entries.");
    }
}

function parseLogContents(contents) {
    const trimmedContents = contents.trim();

    if (!trimmedContents) {
        return [];
    }

    try {
        const parsedJson = JSON.parse(trimmedContents);
        return Array.isArray(parsedJson) ? parsedJson : [parsedJson];
    } catch {
        const lines = trimmedContents
            .split(/\r?\n/)
            .map(function (line) {
                return line.trim();
            })
            .filter(Boolean);

        const parsedItems = [];

        lines.forEach(function (line, index) {
            try {
                parsedItems.push(JSON.parse(line));
            } catch (error) {
                throw new Error("Invalid JSON entry on line " + (index + 1) + ": " + error.message);
            }
        });

        return parsedItems;
    }
}

function filterLogs() {
    if (!Array.isArray(wholeJson) || wholeJson.length === 0) {
        return;
    }

    showLoader();

    setTimeout(function () {
        try {
            const firstMessageFilter = elements.filterMessage.value.trim().toLowerCase();
            const secondMessageFilter = elements.filterMessage2.value.trim().toLowerCase();
            const levelFilter = elements.filterLevel.value.trim().toUpperCase();

            const filteredJson = wholeJson.filter(function (item) {
                const message = getItemMessage(item).toLowerCase();
                const level = getItemLevel(item);

                return (
                    (firstMessageFilter === "" || message.includes(firstMessageFilter)) &&
                    (secondMessageFilter === "" || message.includes(secondMessageFilter)) &&
                    (levelFilter === "" || level === levelFilter)
                );
            });

            createTable(filteredJson);
        } catch (error) {
            alert(error.message || String(error));
        } finally {
            hideLoader();
        }
    }, 0);
}

function createTable(filteredJson) {
    let innerHtml =
        '<div class="resultSummary">' +
        "<div>Entries found: <strong>" + filteredJson.length + "</strong></div>" +
        '<div class="fileName" title="' + escapeHtml(selectedFileName) + '">' +
        escapeHtml(selectedFileName) +
        "</div>" +
        "</div>";

    if (filteredJson.length === 0) {
        elements.tableContainer.innerHTML =
            innerHtml + '<div class="emptyState">No entries match the current filters.</div>';
        return;
    }

    filteredJson.forEach(function (item) {
        const level = getItemLevel(item);
        const message = getItemMessage(item);
        const loggedOn = getItemLoggedOn(item);
        const jsonText = JSON.stringify(item, null, 2);

        innerHtml +=
            '<div class="itemContainer jsonHidden">' +
                '<div class="summary ' + escapeHtml(level) + '" onclick="toggleItem(this)">' +
                    '<div class="time">' + escapeHtml(loggedOn) + "</div>" +
                    '<div class="level">' + escapeHtml(level) + "</div>" +
                    '<div class="message" title="' + escapeHtml(message) + '">' +
                        escapeHtml(summarizeText(message, 250)) +
                    "</div>" +
                    '<div class="expandIcon">›</div>' +
                "</div>" +
                '<pre class="json">' + escapeHtml(jsonText) + "</pre>" +
            "</div>";
    });

    elements.tableContainer.innerHTML = innerHtml;
}

function getItemMessage(item) {
    if (item === null || item === undefined) {
        return "";
    }

    if (item.message !== null && item.message !== undefined) {
        return String(item.message);
    }

    if (item.Message !== null && item.Message !== undefined) {
        return String(item.Message);
    }

    return "";
}

function getItemLevel(item) {
    if (item === null || item === undefined) {
        return "UNKNOWN";
    }

    return String(item.level ?? item.Level ?? "UNKNOWN").toUpperCase();
}

function getItemLoggedOn(item) {
    if (item === null || item === undefined) {
        return "";
    }

    const loggedOn =
        item.loggedOn ??
        item.LoggedOn ??
        item.timestamp ??
        item.Timestamp ??
        item.date ??
        item.Date ??
        "";

    const text = String(loggedOn);
    return text.length >= 19 ? text.substring(0, 19).replace("T", " ") : text;
}

function toggleItem(target) {
    target.parentElement.classList.toggle("jsonHidden");
}

function summarizeText(text, maxLength) {
    if (text.length <= maxLength) {
        return text;
    }

    return text.substring(0, maxLength) + "...";
}

function escapeHtml(value) {
    const html = String(value ?? "");
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
        "/": "&#x2F;",
        "`": "&#x60;",
        "=": "&#x3D;"
    };

    return html.replace(/[&<>"'/`=]/g, function (character) {
        return map[character];
    });
}

function showLoader() {
    elements.overlay.style.display = "flex";
}

function hideLoader() {
    elements.overlay.style.display = "none";
}
