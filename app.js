let wholeJson = [];
let selectedFileName = "";

const elements = {
    fileInput: document.getElementById("fileInput"),
    filterLevel: document.getElementById("filterLevel"),
    filterMessage: document.getElementById("filterMessage"),
    filterMessage2: document.getElementById("filterMessage2"),
    filterButton: document.getElementById("filterButton"),
    tableContainer: document.getElementById("tableContainer")
};

elements.fileInput.addEventListener("change", onFileChange);
elements.filterButton.addEventListener("click", search);
document.querySelectorAll("#filterMessage, #filterMessage2").forEach(function (input) {
    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") search();
    });
});

async function onFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    selectedFileName = file.name;
    wholeJson = [];
    showLoader();

    try {
        wholeJson = await loadFile(file);
        elements.filterButton.disabled = false;
        await render(wholeJson);
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

async function loadFile(file) {
    if (file.name.toLowerCase().endsWith(".zip")) {
        const zip = await JSZip.loadAsync(file);
        const out = [];

        for (const entry of Object.values(zip.files)) {
            if (entry.dir || !/\.(json|log|txt)$/i.test(entry.name)) continue;
            out.push(...parse(await entry.async("string")));
        }

        if (!out.length) {
            throw new Error("ZIP file does not contain readable JSON, LOG, or TXT entries.");
        }

        return out;
    }

    return parse(await file.text());
}

function parse(text) {
    const trimmed = text.trim();
    if (!trimmed) return [];

    try {
        return [].concat(JSON.parse(trimmed)).map(function (item) {
            item._msg = getMessage(item).toLowerCase();
            item._lvl = getLevel(item);
            return item;
        });
    } catch {
        return trimmed.split(/\r?\n/).filter(Boolean).map(function (line, index) {
            try {
                const item = JSON.parse(line);
                item._msg = getMessage(item).toLowerCase();
                item._lvl = getLevel(item);
                return item;
            } catch (error) {
                throw new Error("Invalid JSON entry on line " + (index + 1) + ": " + error.message);
            }
        });
    }
}

function search() {
    if (!wholeJson.length) return;
    showLoader();

    setTimeout(function () {
        try {
            const q1 = elements.filterMessage.value.trim().toLowerCase();
            const q2 = elements.filterMessage2.value.trim().toLowerCase();
            const lvl = elements.filterLevel.value.trim().toUpperCase();

            render(wholeJson.filter(function (item) {
                return (!q1 || item._msg.includes(q1)) &&
                    (!q2 || item._msg.includes(q2)) &&
                    (!lvl || item._lvl === lvl);
            }));
        } catch (error) {
            alert(error.message || String(error));
        } finally {
            hideLoader();
        }
    }, 0);
}

async function render(items) {
    const base =
        '<div class="resultSummary">' +
        "<div>Entries found: <strong>" + items.length + "</strong></div>" +
        '<div class="fileName" title="' + escapeHtml(selectedFileName) + '">' +
        escapeHtml(selectedFileName) +
        "</div>" +
        "</div>";

    if (!items.length) {
        elements.tableContainer.innerHTML = base + '<div class="emptyState">No entries match the current filters.</div>';
        return;
    }

    elements.tableContainer.innerHTML = base;

    let chunk = "";
    for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        chunk +=
            '<div class="itemContainer jsonHidden">' +
                '<div class="summary ' + escapeHtml(getLevel(item)) + '" onclick="toggleItem(this)">' +
                    '<div class="time">' + escapeHtml(getLoggedOn(item)) + "</div>" +
                    '<div class="level">' + escapeHtml(getLevel(item)) + "</div>" +
                    '<div class="message" title="' + escapeHtml(getMessage(item)) + '">' +
                        escapeHtml(truncate(getMessage(item), 250)) +
                    "</div>" +
                    '<div class="expandIcon">›</div>' +
                "</div>" +
                '<pre class="json">' + escapeHtml(JSON.stringify(item, null, 2)) + "</pre>" +
            "</div>";

        if ((i + 1) % BATCH_SIZE === 0) {
            elements.tableContainer.insertAdjacentHTML("beforeend", chunk);
            chunk = "";
            await frame();
        }
    }

    if (chunk) elements.tableContainer.insertAdjacentHTML("beforeend", chunk);
}
