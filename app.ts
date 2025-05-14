// Import the Form type from the local module
import { Form } from "./model/model";

// Entry point function to render form cards on the page
function start(): void {
  // Retrieve stored forms from localStorage and parse them as an array of Form objects
  const forms = JSON.parse(localStorage.getItem("forms") || "[]") as Form[];

  // Get references to the DOM elements where the form cards will be appended
  const unpublishedRow = document.getElementById("unpublished-form-card-row");
  const publishedRow = document.getElementById("published-form-card-row");

  // Exit early if required DOM elements are not found
  if (!unpublishedRow || !publishedRow) return;

  // Iterate through each form and create a visual card for it
  forms.forEach(({ id, title, published }) => {
    // Create a container div for the form card
    const card = document.createElement("div");
    card.className = "column";

    // Conditionally render action buttons if the form is published
    const formActionButtons = published
      ? `
          <button class="form-option-buttons" onclick="fetchResponseURL('${id}')" title="Copy fill response URL">
            Get Form URL
          </button>
          <button class="form-option-buttons" onclick="location.href='form/?id=${id}&mode=response-review'" title="View form responses">
            Check Responses
          </button>
        `
      : "";

    // Set the inner HTML for the card with edit button, title, and action buttons
    card.innerHTML = `
        <div class="card">
          <button class="edit-form-button" onclick="location.href='form/?id=${id}&mode=builder'">
            <i class="fa fa-edit fa-lg" title="Edit form"></i>
          </button>
          <p class="text-overflow-hidden">${title}</p>
          <div style="display: flex; flex-direction: column;">
            ${formActionButtons}
          </div>
        </div>
      `;

    // Append the card to the appropriate section based on publication status
    (published ? publishedRow : unpublishedRow).appendChild(card);
  });
}

// Copies the response URL for a given form to the clipboard
function fetchResponseURL(formId: string): void {
  // Validate form ID
  if (!formId) return console.error("Form ID is missing");

  // Construct the response URL
  const url = `${location.origin}/form/?id=${encodeURIComponent(
    formId
  )}&mode=response`;

  // Try copying the URL to the clipboard and show alert
  navigator.clipboard
    ?.writeText(url)
    .then(() => alert("URL copied to clipboard!"))
    .catch((err) => {
      console.error("Failed to copy URL:", err);
      alert("Failed to copy URL");
    });
}

// Invoke the start function on script load
start();
