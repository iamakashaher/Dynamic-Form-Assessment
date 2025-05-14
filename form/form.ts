// Import necessary types from the index module
import { Form, FormResponse, Question } from "../model/model";

// Global variable to store the current form object
let cellTechForm: Form;

/**
 * Parses query parameters from the URL and returns them as a key-value object.
 */
function fetchModeOfForm(): Record<string, string> {
  const result: Record<string, string> = {};
  const queryString = window.location.search.substring(1);
  const params = queryString.split("&");

  for (const param of params) {
    const [key, value] = param.split("=");
    if (key) {
      result[key] = decodeURIComponent(value || "");
    }
  }
  return result;
}

/**
 * Initializes the form builder or loads the appropriate mode (builder, response, response-review).
 */
function startFormBuilder(): void {
  const params = fetchModeOfForm();
  const mode = params.mode || "builder";
  const container = document.getElementById(`form-${mode}`) as HTMLElement;

  if (params.id && params.mode) {
    const forms: Form[] = JSON.parse(localStorage.getItem("forms") || "[]");
    cellTechForm = forms.find((f) => f.id === params.id)!;

    if (!cellTechForm) throw new Error("Form not found.");

    switch (mode) {
      case "builder":
        BuildQuestionsMarkUp(cellTechForm, "questions");
        break;
      case "response":
        viewForm();
        break;
      case "response-review":
        const responses: FormResponse[] = JSON.parse(
          localStorage.getItem(cellTechForm.id) || "[]"
        );
        responses.forEach((r, i) => getFormResponses(r.responses as any, i));
        break;
    }
  } else {
    // Create a new form if no form ID is provided
    cellTechForm = {
      id: crypto.randomUUID(),
      title: "Form",
      published: false,
      questions: [],
    };
  }

  container.classList.remove("hidden");

  const formTitle = document.getElementById("formTitle") as HTMLInputElement;
  if (formTitle) formTitle.value = cellTechForm.title;
}

startFormBuilder(); // Start the builder on script load

/**
 * Updates the form title when changed by the user.
 */
function changeTitle(value: string): void {
  const trimmedValue = value.trim();
  if (trimmedValue) {
    cellTechForm.title = trimmedValue;
  } else {
    console.warn("Form title cannot be empty or just whitespace.");
  }
}

/**
 * Adds a new question of the given type to the form.
 */
function newQuestion(type: "text" | "choice" | "checkbox"): void {
  cellTechForm.questions.push({ type, label: "" });
  BuildQuestionsMarkUp(cellTechForm, "questions");
}

/**
 * Renders the form questions markup based on the mode.
 */
function BuildQuestionsMarkUp(
  form: Form,
  mode: "questions" | "preview" | "response" | "response-review",
  responses?: string[]
): void {
  const questionsContainer = document.getElementById(`${mode}-container`);
  if (!questionsContainer) return;
  if (mode !== "response-review") questionsContainer.innerHTML = "";

  if (mode === "questions") {
    // Editable builder mode
    form.questions.forEach((question, index) => {
      const questionBlock = document.createElement("div");
      questionBlock.className = "question-block";
      questionBlock.dataset.index = index.toString();

      // Controls: delete and question type select
      const controlsContainer = document.createElement("div");
      controlsContainer.className = "controls-container";

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.onclick = () => {
        form.questions.splice(index, 1);
        BuildQuestionsMarkUp(form, "questions");
      };

      const typeSelect = document.createElement("select");
      typeSelect.className = "question-type-select";
      ["text", "choice", "checkbox"].forEach((type) => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        option.selected = question.type === type;
        typeSelect.appendChild(option);
      });

      typeSelect.onchange = (event) => {
        const target = event.target as HTMLSelectElement;
        form.questions[index].type = target.value as
          | "text"
          | "choice"
          | "checkbox";
        if (["choice", "checkbox"].includes(target.value)) {
          form.questions[index].options = form.questions[index].options || [
            "Option 1",
          ];
        } else {
          delete form.questions[index].options;
        }
        BuildQuestionsMarkUp(form, "questions");
      };

      controlsContainer.appendChild(deleteButton);
      controlsContainer.appendChild(typeSelect);
      questionBlock.appendChild(controlsContainer);

      // Question text input
      const questionInput = document.createElement("input");
      questionInput.type = "text";
      questionInput.placeholder = "Enter your question";
      questionInput.value = question.label;
      questionInput.className = "question-input";
      questionInput.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        form.questions[index].label = target.value;
      };

      questionBlock.appendChild(questionInput);

      // Options (if applicable)
      if (["choice", "checkbox"].includes(question.type)) {
        const optionsContainer = document.createElement("div");
        optionsContainer.className = "options-container";
        addOption(optionsContainer, question);

        const addOptionButton = document.createElement("button");
        addOptionButton.textContent = "Add Option";
        addOptionButton.onclick = () => {
          question.options = question.options || [];
          question.options.push(`Option ${question.options.length + 1}`);
          BuildQuestionsMarkUp(form, "questions");
        };

        optionsContainer.appendChild(addOptionButton);
        questionBlock.appendChild(optionsContainer);
      } else {
        // Placeholder for answer input
        const questionAnswer = document.createElement("input");
        questionAnswer.readOnly = true;
        questionAnswer.type = "text";
        questionAnswer.className = "question-answer";
        questionAnswer.placeholder = "Enter your answer";
        questionBlock.appendChild(questionAnswer);
      }

      questionsContainer.appendChild(questionBlock);
    });
  } else {
    // Preview, Response, and Response-Review modes
    const formElement = document.createElement("form");
    formElement.id = mode + "-form";

    form.questions.forEach((question, index) => {
      const questionBlock = document.createElement("div");
      questionBlock.className = "question-block";

      const label = document.createElement("label");
      label.textContent = question.label;
      questionBlock.appendChild(label);

      switch (question.type) {
        case "text":
          const input = document.createElement("input");
          input.className = "question-input";
          input.type = "text";
          input.name = `question_${index}`;
          input.required = true;
          if (mode === "response-review" && responses) {
            input.value = responses[index] || "";
            input.readOnly = true;
          }
          questionBlock.appendChild(input);
          break;

        case "choice":
          question.options?.forEach((option) => {
            const radioDiv = document.createElement("div");
            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = `question_${index}`;
            radio.value = option;
            radio.required = true;

            if (mode === "response-review") {
              radio.disabled = true;
              radio.checked = option === responses?.[index];
            }

            const optionLabel = document.createElement("label");
            optionLabel.textContent = option;

            radioDiv.appendChild(radio);
            radioDiv.appendChild(optionLabel);
            questionBlock.appendChild(radioDiv);
          });
          break;

        case "checkbox":
          question.options?.forEach((option) => {
            const checkDiv = document.createElement("div");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = `question_${index}`;
            checkbox.value = option;

            if (mode === "response-review") {
              checkbox.disabled = true;
              const responseArray = Array.isArray(responses?.[index])
                ? responses[index]
                : [];
              checkbox.checked = responseArray.includes(option);
            }

            const optionLabel = document.createElement("label");
            optionLabel.textContent = option;

            checkDiv.appendChild(checkbox);
            checkDiv.appendChild(optionLabel);
            questionBlock.appendChild(checkDiv);
          });
          break;
      }

      formElement.appendChild(questionBlock);
    });

    questionsContainer.appendChild(formElement);
  }
}

/**
 * Adds editable options to a multiple-choice or checkbox question.
 */
function addOption(container: HTMLDivElement, question: Question): void {
  question.options?.forEach((option, optionIndex) => {
    const optionDiv = document.createElement("div");
    optionDiv.style.display = "flex";
    optionDiv.style.gap = "10px";
    optionDiv.style.marginBottom = "10px";

    const optionInput = document.createElement("input");
    optionInput.className = "option-input";
    optionInput.type = "text";
    optionInput.value = option;
    optionInput.placeholder = "Enter option";
    optionInput.style.flex = "1";

    optionInput.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      if (question.options) {
        question.options[optionIndex] = target.value;
      }
    };

    const deleteOption = document.createElement("button");
    deleteOption.textContent = "Delete Option";
    deleteOption.onclick = () => {
      if (question.options && question.options.length > 1) {
        question.options.splice(optionIndex, 1);
        BuildQuestionsMarkUp(cellTechForm, "questions");
      }
    };

    optionDiv.appendChild(optionInput);
    optionDiv.appendChild(deleteOption);
    container.appendChild(optionDiv);
  });
}

/**
 * Displays a preview of the form for review before submission.
 */
function previewForm(): void {
  const formBuilder = document.querySelector(".form-builder") as HTMLElement;
  const formPreview = document.getElementById("form-preview") as HTMLElement;
  const previewContainer = document.getElementById("preview-container") as HTMLElement;

  previewContainer.innerHTML = `<h1>${cellTechForm.title}</h1>`;
  BuildQuestionsMarkUp(cellTechForm, "preview");

  formBuilder.classList.add("hidden");
  formPreview.classList.remove("hidden");
}

/**
 * Renders the form in response mode for user submission.
 */
function viewForm(): void {
  const responseContainer = document.getElementById("response-container") as HTMLElement;
  responseContainer.innerHTML = `<h1>${cellTechForm.title}</h1>`;
  BuildQuestionsMarkUp(cellTechForm, "response");
}

/**
 * Displays individual responses in response-review mode.
 */
function getFormResponses(responses: string[], index: number): void {
  const responseContainer = document.getElementById("response-review-container") as HTMLElement;

  const formTitleElement = document.createElement("h1");
  formTitleElement.innerHTML = `${cellTechForm.title} - Response ${index}`;
  responseContainer.appendChild(formTitleElement);

  BuildQuestionsMarkUp(cellTechForm, "response-review", responses);
}

/**
 * Navigates back from preview to edit mode.
 */
function backToEdit(): void {
  const formBuilder = document.querySelector(".form-builder") as HTMLElement;
  const formPreview = document.getElementById("form-preview") as HTMLElement;

  formBuilder?.classList.remove("hidden");
  formPreview?.classList.add("hidden");
}

/**
 * Saves the current form to local storage.
 */
function saveForm(): void {
  const formsKey = "forms";
  const formsData = localStorage.getItem(formsKey);
  const forms: Form[] = JSON.parse(formsData || "[]");

  const updatedForms = [
    ...forms.filter((existingForm) => existingForm.id !== cellTechForm.id),
    cellTechForm,
  ];

  localStorage.setItem(formsKey, JSON.stringify(updatedForms));
  alert("Form saved successfully");
}

/**
 * Publishes the form and redirects to the response mode.
 */
function publishForm(): void {
  cellTechForm.published = true;
  saveForm();
  location.href = `/form/?id=${cellTechForm.id}&mode=response`;
}

/**
 * Collects and submits form responses, saving them in localStorage.
 */
function submit(): void {
  const response: FormResponse = {
    id: crypto.randomUUID(),
    formId: cellTechForm.id,
    responses: [],
  };

  const questionGroups = new Map<string, HTMLInputElement[]>();

  // Group inputs by name
  for (let i = 0; i < document.forms[0].length; i++) {
    const input = document.forms[0][i] as HTMLInputElement;
    const name = input.name;
    if (!questionGroups.has(name)) {
      questionGroups.set(name, []);
    }
    questionGroups.get(name)?.push(input);
  }

  // Process each question's response
  questionGroups.forEach((inputs) => {
    const firstInput = inputs[0];
    let responseValue: string | string[] = "";

    if (firstInput.type === "text") {
      responseValue = firstInput.value || "";
    } else if (firstInput.type === "radio") {
      const checkedRadio = inputs.find((input) => input.checked);
      responseValue = checkedRadio ? checkedRadio.value : "";
    } else if (firstInput.type === "checkbox") {
      const checkedBoxes = inputs
        .filter((input) => input.checked)
        .map((input) => input.value);
      responseValue = checkedBoxes.length > 0 ? checkedBoxes : "";
    }

    response.responses.push(responseValue);
  });

  // Save the response to localStorage
  const responseKey = cellTechForm.id;
  const responseData = localStorage.getItem(responseKey);
  const responses = JSON.parse(responseData || "[]");

  localStorage.setItem(responseKey, JSON.stringify([...responses, response]));
}
