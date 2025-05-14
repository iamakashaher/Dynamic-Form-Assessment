"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
// Global variable to store the current form object
var cellTechForm;
/**
 * Parses query parameters from the URL and returns them as a key-value object.
 */
function fetchModeOfForm() {
    var result = {};
    var queryString = window.location.search.substring(1);
    var params = queryString.split("&");
    for (var _i = 0, params_1 = params; _i < params_1.length; _i++) {
        var param = params_1[_i];
        var _a = param.split("="), key = _a[0], value = _a[1];
        if (key) {
            result[key] = decodeURIComponent(value || "");
        }
    }
    return result;
}
/**
 * Initializes the form builder or loads the appropriate mode (builder, response, response-review).
 */
function startFormBuilder() {
    var params = fetchModeOfForm();
    var mode = params.mode || "builder";
    var container = document.getElementById("form-".concat(mode));
    if (params.id && params.mode) {
        var forms = JSON.parse(localStorage.getItem("forms") || "[]");
        cellTechForm = forms.find(function (f) { return f.id === params.id; });
        if (!cellTechForm)
            throw new Error("Form not found.");
        switch (mode) {
            case "builder":
                BuildQuestionsMarkUp(cellTechForm, "questions");
                break;
            case "response":
                viewForm();
                break;
            case "response-review":
                var responses = JSON.parse(localStorage.getItem(cellTechForm.id) || "[]");
                responses.forEach(function (r, i) { return getFormResponses(r.responses, i); });
                break;
        }
    }
    else {
        // Create a new form if no form ID is provided
        cellTechForm = {
            id: crypto.randomUUID(),
            title: "Form",
            published: false,
            questions: [],
        };
    }
    container.classList.remove("hidden");
    var formTitle = document.getElementById("formTitle");
    if (formTitle)
        formTitle.value = cellTechForm.title;
}
startFormBuilder(); // Start the builder on script load
/**
 * Updates the form title when changed by the user.
 */
function changeTitle(value) {
    var trimmedValue = value.trim();
    if (trimmedValue) {
        cellTechForm.title = trimmedValue;
    }
    else {
        console.warn("Form title cannot be empty or just whitespace.");
    }
}
/**
 * Adds a new question of the given type to the form.
 */
function newQuestion(type) {
    cellTechForm.questions.push({ type: type, label: "" });
    BuildQuestionsMarkUp(cellTechForm, "questions");
}
/**
 * Renders the form questions markup based on the mode.
 */
function BuildQuestionsMarkUp(form, mode, responses) {
    var questionsContainer = document.getElementById("".concat(mode, "-container"));
    if (!questionsContainer)
        return;
    if (mode !== "response-review")
        questionsContainer.innerHTML = "";
    if (mode === "questions") {
        // Editable builder mode
        form.questions.forEach(function (question, index) {
            var questionBlock = document.createElement("div");
            questionBlock.className = "question-block";
            questionBlock.dataset.index = index.toString();
            // Controls: delete and question type select
            var controlsContainer = document.createElement("div");
            controlsContainer.className = "controls-container";
            var deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.onclick = function () {
                form.questions.splice(index, 1);
                BuildQuestionsMarkUp(form, "questions");
            };
            var typeSelect = document.createElement("select");
            typeSelect.className = "question-type-select";
            ["text", "choice", "checkbox"].forEach(function (type) {
                var option = document.createElement("option");
                option.value = type;
                option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
                option.selected = question.type === type;
                typeSelect.appendChild(option);
            });
            typeSelect.onchange = function (event) {
                var target = event.target;
                form.questions[index].type = target.value;
                if (["choice", "checkbox"].includes(target.value)) {
                    form.questions[index].options = form.questions[index].options || [
                        "Option 1",
                    ];
                }
                else {
                    delete form.questions[index].options;
                }
                BuildQuestionsMarkUp(form, "questions");
            };
            controlsContainer.appendChild(deleteButton);
            controlsContainer.appendChild(typeSelect);
            questionBlock.appendChild(controlsContainer);
            // Question text input
            var questionInput = document.createElement("input");
            questionInput.type = "text";
            questionInput.placeholder = "Enter your question";
            questionInput.value = question.label;
            questionInput.className = "question-input";
            questionInput.onchange = function (event) {
                var target = event.target;
                form.questions[index].label = target.value;
            };
            questionBlock.appendChild(questionInput);
            // Options (if applicable)
            if (["choice", "checkbox"].includes(question.type)) {
                var optionsContainer = document.createElement("div");
                optionsContainer.className = "options-container";
                addOption(optionsContainer, question);
                var addOptionButton = document.createElement("button");
                addOptionButton.textContent = "Add Option";
                addOptionButton.onclick = function () {
                    question.options = question.options || [];
                    question.options.push("Option ".concat(question.options.length + 1));
                    BuildQuestionsMarkUp(form, "questions");
                };
                optionsContainer.appendChild(addOptionButton);
                questionBlock.appendChild(optionsContainer);
            }
            else {
                // Placeholder for answer input
                var questionAnswer = document.createElement("input");
                questionAnswer.readOnly = true;
                questionAnswer.type = "text";
                questionAnswer.className = "question-answer";
                questionAnswer.placeholder = "Enter your answer";
                questionBlock.appendChild(questionAnswer);
            }
            questionsContainer.appendChild(questionBlock);
        });
    }
    else {
        // Preview, Response, and Response-Review modes
        var formElement_1 = document.createElement("form");
        formElement_1.id = mode + "-form";
        form.questions.forEach(function (question, index) {
            var _a, _b;
            var questionBlock = document.createElement("div");
            questionBlock.className = "question-block";
            var label = document.createElement("label");
            label.textContent = question.label;
            questionBlock.appendChild(label);
            switch (question.type) {
                case "text":
                    var input = document.createElement("input");
                    input.className = "question-input";
                    input.type = "text";
                    input.name = "question_".concat(index);
                    input.required = true;
                    if (mode === "response-review" && responses) {
                        input.value = responses[index] || "";
                        input.readOnly = true;
                    }
                    questionBlock.appendChild(input);
                    break;
                case "choice":
                    (_a = question.options) === null || _a === void 0 ? void 0 : _a.forEach(function (option) {
                        var radioDiv = document.createElement("div");
                        var radio = document.createElement("input");
                        radio.type = "radio";
                        radio.name = "question_".concat(index);
                        radio.value = option;
                        radio.required = true;
                        if (mode === "response-review") {
                            radio.disabled = true;
                            radio.checked = option === (responses === null || responses === void 0 ? void 0 : responses[index]);
                        }
                        var optionLabel = document.createElement("label");
                        optionLabel.textContent = option;
                        radioDiv.appendChild(radio);
                        radioDiv.appendChild(optionLabel);
                        questionBlock.appendChild(radioDiv);
                    });
                    break;
                case "checkbox":
                    (_b = question.options) === null || _b === void 0 ? void 0 : _b.forEach(function (option) {
                        var checkDiv = document.createElement("div");
                        var checkbox = document.createElement("input");
                        checkbox.type = "checkbox";
                        checkbox.name = "question_".concat(index);
                        checkbox.value = option;
                        if (mode === "response-review") {
                            checkbox.disabled = true;
                            var responseArray = Array.isArray(responses === null || responses === void 0 ? void 0 : responses[index])
                                ? responses[index]
                                : [];
                            checkbox.checked = responseArray.includes(option);
                        }
                        var optionLabel = document.createElement("label");
                        optionLabel.textContent = option;
                        checkDiv.appendChild(checkbox);
                        checkDiv.appendChild(optionLabel);
                        questionBlock.appendChild(checkDiv);
                    });
                    break;
            }
            formElement_1.appendChild(questionBlock);
        });
        questionsContainer.appendChild(formElement_1);
    }
}
/**
 * Adds editable options to a multiple-choice or checkbox question.
 */
function addOption(container, question) {
    var _a;
    (_a = question.options) === null || _a === void 0 ? void 0 : _a.forEach(function (option, optionIndex) {
        var optionDiv = document.createElement("div");
        optionDiv.style.display = "flex";
        optionDiv.style.gap = "10px";
        optionDiv.style.marginBottom = "10px";
        var optionInput = document.createElement("input");
        optionInput.className = "option-input";
        optionInput.type = "text";
        optionInput.value = option;
        optionInput.placeholder = "Enter option";
        optionInput.style.flex = "1";
        optionInput.onchange = function (event) {
            var target = event.target;
            if (question.options) {
                question.options[optionIndex] = target.value;
            }
        };
        var deleteOption = document.createElement("button");
        deleteOption.textContent = "Delete Option";
        deleteOption.onclick = function () {
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
function previewForm() {
    var formBuilder = document.querySelector(".form-builder");
    var formPreview = document.getElementById("form-preview");
    var previewContainer = document.getElementById("preview-container");
    previewContainer.innerHTML = "<h1>".concat(cellTechForm.title, "</h1>");
    BuildQuestionsMarkUp(cellTechForm, "preview");
    formBuilder.classList.add("hidden");
    formPreview.classList.remove("hidden");
}
/**
 * Renders the form in response mode for user submission.
 */
function viewForm() {
    var responseContainer = document.getElementById("response-container");
    responseContainer.innerHTML = "<h1>".concat(cellTechForm.title, "</h1>");
    BuildQuestionsMarkUp(cellTechForm, "response");
}
/**
 * Displays individual responses in response-review mode.
 */
function getFormResponses(responses, index) {
    var responseContainer = document.getElementById("response-review-container");
    var formTitleElement = document.createElement("h1");
    formTitleElement.innerHTML = "".concat(cellTechForm.title, " - Response ").concat(index);
    responseContainer.appendChild(formTitleElement);
    BuildQuestionsMarkUp(cellTechForm, "response-review", responses);
}
/**
 * Navigates back from preview to edit mode.
 */
function backToEdit() {
    var formBuilder = document.querySelector(".form-builder");
    var formPreview = document.getElementById("form-preview");
    formBuilder === null || formBuilder === void 0 ? void 0 : formBuilder.classList.remove("hidden");
    formPreview === null || formPreview === void 0 ? void 0 : formPreview.classList.add("hidden");
}
/**
 * Saves the current form to local storage.
 */
function saveForm() {
    var formsKey = "forms";
    var formsData = localStorage.getItem(formsKey);
    var forms = JSON.parse(formsData || "[]");
    var updatedForms = __spreadArray(__spreadArray([], forms.filter(function (existingForm) { return existingForm.id !== cellTechForm.id; }), true), [
        cellTechForm,
    ], false);
    localStorage.setItem(formsKey, JSON.stringify(updatedForms));
    alert("Form saved successfully");
}
/**
 * Publishes the form and redirects to the response mode.
 */
function publishForm() {
    cellTechForm.published = true;
    saveForm();
    location.href = "/form/?id=".concat(cellTechForm.id, "&mode=response");
}
/**
 * Collects and submits form responses, saving them in localStorage.
 */
function submit() {
    var _a;
    var response = {
        id: crypto.randomUUID(),
        formId: cellTechForm.id,
        responses: [],
    };
    var questionGroups = new Map();
    // Group inputs by name
    for (var i = 0; i < document.forms[0].length; i++) {
        var input = document.forms[0][i];
        var name_1 = input.name;
        if (!questionGroups.has(name_1)) {
            questionGroups.set(name_1, []);
        }
        (_a = questionGroups.get(name_1)) === null || _a === void 0 ? void 0 : _a.push(input);
    }
    // Process each question's response
    questionGroups.forEach(function (inputs) {
        var firstInput = inputs[0];
        var responseValue = "";
        if (firstInput.type === "text") {
            responseValue = firstInput.value || "";
        }
        else if (firstInput.type === "radio") {
            var checkedRadio = inputs.find(function (input) { return input.checked; });
            responseValue = checkedRadio ? checkedRadio.value : "";
        }
        else if (firstInput.type === "checkbox") {
            var checkedBoxes = inputs
                .filter(function (input) { return input.checked; })
                .map(function (input) { return input.value; });
            responseValue = checkedBoxes.length > 0 ? checkedBoxes : "";
        }
        response.responses.push(responseValue);
    });
    // Save the response to localStorage
    var responseKey = cellTechForm.id;
    var responseData = localStorage.getItem(responseKey);
    var responses = JSON.parse(responseData || "[]");
    localStorage.setItem(responseKey, JSON.stringify(__spreadArray(__spreadArray([], responses, true), [response], false)));
}
