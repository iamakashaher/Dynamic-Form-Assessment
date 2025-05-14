"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Entry point function to render form cards on the page
function start() {
    // Retrieve stored forms from localStorage and parse them as an array of Form objects
    var forms = JSON.parse(localStorage.getItem("forms") || "[]");
    // Get references to the DOM elements where the form cards will be appended
    var unpublishedRow = document.getElementById("unpublished-form-card-row");
    var publishedRow = document.getElementById("published-form-card-row");
    // Exit early if required DOM elements are not found
    if (!unpublishedRow || !publishedRow)
        return;
    // Iterate through each form and create a visual card for it
    forms.forEach(function (_a) {
        var id = _a.id, title = _a.title, published = _a.published;
        // Create a container div for the form card
        var card = document.createElement("div");
        card.className = "column";
        // Conditionally render action buttons if the form is published
        var formActionButtons = published
            ? "\n          <button class=\"form-option-buttons\" onclick=\"fetchResponseURL('".concat(id, "')\" title=\"Copy fill response URL\">\n            Get Form URL\n          </button>\n          <button class=\"form-option-buttons\" onclick=\"location.href='form/?id=").concat(id, "&mode=response-review'\" title=\"View form responses\">\n            Check Responses\n          </button>\n        ")
            : "";
        // Set the inner HTML for the card with edit button, title, and action buttons
        card.innerHTML = "\n        <div class=\"card\">\n          <button class=\"edit-form-button\" onclick=\"location.href='form/?id=".concat(id, "&mode=builder'\">\n            <i class=\"fa fa-edit fa-lg\" title=\"Edit form\"></i>\n          </button>\n          <p class=\"text-overflow-hidden\">").concat(title, "</p>\n          <div style=\"display: flex; flex-direction: column;\">\n            ").concat(formActionButtons, "\n          </div>\n        </div>\n      ");
        // Append the card to the appropriate section based on publication status
        (published ? publishedRow : unpublishedRow).appendChild(card);
    });
}
// Copies the response URL for a given form to the clipboard
function fetchResponseURL(formId) {
    var _a;
    // Validate form ID
    if (!formId)
        return console.error("Form ID is missing");
    // Construct the response URL
    var url = "".concat(location.origin, "/form/?id=").concat(encodeURIComponent(formId), "&mode=response");
    // Try copying the URL to the clipboard and show alert
    (_a = navigator.clipboard) === null || _a === void 0 ? void 0 : _a.writeText(url).then(function () { return alert("URL copied to clipboard!"); }).catch(function (err) {
        console.error("Failed to copy URL:", err);
        alert("Failed to copy URL");
    });
}
// Invoke the start function on script load
start();
