// ================================
// DOM Elements
// ================================

const taskInput = document.getElementById("task-input");
const taskPriority = document.getElementById("task-priority");
const addTaskBtn = document.getElementById("add-task-btn");
const taskList = document.getElementById("task-list");
const taskCounter = document.getElementById("task-counter");
const emptyState = document.getElementById("empty-state");
const clearCompletedBtn = document.getElementById("clear-completed-btn");
const filterButtons = document.querySelectorAll(".filter-btn");


// ================================
// Load Tasks
// ================================

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem("tasks");

        if (!savedTasks) {
            return [];
        }

        const parsedTasks = JSON.parse(savedTasks);

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        return parsedTasks
            .filter(function (task) {
                return task &&
                    typeof task === "object" &&
                    !Array.isArray(task) &&
                    (typeof task.id === "string" ||
                     typeof task.id === "number") &&
                    typeof task.text === "string";
            })
            .map(function (task) {
                return {
                    ...task,

                    priority: ["high", "medium", "low"].includes(task.priority)
                        ? task.priority
                        : "medium",

                    completed: typeof task.completed === "boolean"
                        ? task.completed
                        : false,

                    createdAt: typeof task.createdAt === "string"
                        ? task.createdAt
                        : ""
                };
            });

    } catch (error) {
        console.error("Could not load tasks:", error);
        return [];
    }
}

let tasks = loadTasks();
let currentFilter = "all";
let editingTaskId = null;


// ================================
// Initial Setup
// ================================

addTaskBtn.disabled = true;

taskInput.addEventListener("input", function () {
    addTaskBtn.disabled = taskInput.value.trim() === "";
});


// ================================
// Add Task
// ================================

addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        addTask();
    }
});

function addTask() {
    const taskText = taskInput.value.trim();

    if (taskText === "") {
        return;
    }

    const selectedPriority = ["high", "medium", "low"].includes(taskPriority.value)
        ? taskPriority.value
        : "medium";

    const task = {
        id: crypto.randomUUID(),
        text: taskText,
        priority: selectedPriority,
        completed: false,
        createdAt: new Date().toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        })
    };

    tasks.push(task);

    if (!saveTasks()) {
        tasks.pop();
        return;
    }

    renderTasks();

    taskInput.value = "";

    addTaskBtn.disabled = true;
    taskInput.focus();
}


// ================================
// Clear Completed Tasks
// ================================

clearCompletedBtn.addEventListener("click", function () {
    const previousTasks = tasks;

    tasks = tasks.filter(function (task) {
        return !task.completed;
    });

    if (!saveTasks()) {
        tasks = previousTasks;
        return;
    }

    renderTasks();
});

// ================================
// Render Tasks
// ================================

function renderTasks() {
    taskList.innerHTML = "";

    let filteredTasks = tasks;

    if (currentFilter === "active") {
        filteredTasks = tasks.filter(function (task) {
            return !task.completed;
        });
    }

    if (currentFilter === "completed") {
        filteredTasks = tasks.filter(function (task) {
            return task.completed;
        });
    }


    // Empty State

    if (filteredTasks.length === 0) {
        emptyState.style.display = "block";

        if (currentFilter === "active") {
            emptyState.textContent = "No active tasks. Great job!";
        } else if (currentFilter === "completed") {
            emptyState.textContent = "No completed tasks yet.";
        } else {
            emptyState.textContent = "No tasks yet. Add your first task!";
        }

    } else {
        emptyState.style.display = "none";
    }


    // Display Tasks

    filteredTasks.forEach(function (task) {
        const li = document.createElement("li");
        li.className = "task-item";
        if (task.completed) {
            li.classList.add("completed");
        }

        const taskContent = document.createElement("div");
        taskContent.className = "task-content";


        // Editing Mode

        if (String(task.id) === editingTaskId) {

            const editInput = document.createElement("input");

            editInput.type = "text";
            editInput.className = "edit-input";
            editInput.value = task.text;
            editInput.setAttribute("aria-label", "Edit task");

            taskContent.appendChild(editInput);


            // Edit Priority

            const editPriority = document.createElement("select");

            editPriority.className = "edit-priority";
            editPriority.setAttribute("aria-label", "Edit task priority");

            ["high", "medium", "low"].forEach(function (priority) {

                const option = document.createElement("option");

                option.value = priority;

                option.textContent =
                    priority.charAt(0).toUpperCase() + priority.slice(1);

                if (priority === (task.priority || "medium")) {
                    option.selected = true;
                }

                editPriority.appendChild(option);
            });

            taskContent.appendChild(editPriority);


            // Save Button

            const saveBtn = document.createElement("button");

            saveBtn.type = "button";
            saveBtn.textContent = "Save";
            saveBtn.className = "save-btn";
            saveBtn.dataset.id = task.id;


            // Cancel Button

            const cancelBtn = document.createElement("button");

            cancelBtn.type = "button";
            cancelBtn.textContent = "Cancel";
            cancelBtn.className = "cancel-btn";
            cancelBtn.dataset.id = task.id;


            li.appendChild(taskContent);
            li.appendChild(saveBtn);
            li.appendChild(cancelBtn);

            editInput.focus();


        } else {

            // Priority Badge

            const priorityBadge = document.createElement("span");

            const priority = task.priority || "medium";

            priorityBadge.className =
                "priority-badge priority-" + priority;

            priorityBadge.textContent =
                priority.charAt(0).toUpperCase() + priority.slice(1);

            taskContent.appendChild(priorityBadge);


            // Task Text

            const taskSpan = document.createElement("button");

            taskSpan.type = "button";
            taskSpan.textContent = task.text;
            taskSpan.className = "task-text";
            taskSpan.dataset.id = task.id;

            taskSpan.setAttribute("aria-pressed", task.completed);

            taskContent.appendChild(taskSpan);


            // Creation Date

            if (task.createdAt) {
                const taskDate = document.createElement("small");

                taskDate.className = "task-date";
                taskDate.textContent = task.createdAt;

                taskContent.appendChild(taskDate);
            }


            // Edit Button

            const editBtn = document.createElement("button");

            editBtn.type = "button";
            editBtn.textContent = "Edit";
            editBtn.className = "edit-btn";
            editBtn.dataset.id = task.id;

            li.appendChild(taskContent);
            li.appendChild(editBtn);
        }


        // Delete Button

        const deleteBtn = document.createElement("button");

        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-btn";
        deleteBtn.dataset.id = task.id;

        li.appendChild(deleteBtn);

        taskList.appendChild(li);
    });


    // Update Counter

    const remainingTasks = tasks.filter(function (task) {
        return !task.completed;
    }).length;

    taskCounter.textContent = remainingTasks === 1
        ? "1 task left"
        : remainingTasks + " tasks left";
    const completedTasks = tasks.filter(function (task) {
    return task.completed;
    }).length;

    clearCompletedBtn.disabled = completedTasks === 0;
    }
// ================================
// Save Tasks
// ================================

function saveTasks() {
    try {
        localStorage.setItem("tasks", JSON.stringify(tasks));
        return true;

    } 
    catch (error) {
    console.error("Could not save tasks:", error);

    alert("Unable to save tasks. Please check your browser storage.");

    return false;
}
}

// ================================
// Task List Click Events
// ================================

taskList.addEventListener("click", function (event) {

    const id = event.target.dataset.id;


    // Start Editing

    if (event.target.classList.contains("edit-btn")) {
        editingTaskId = id;
        renderTasks();
        return;
    }


    // Save Edited Task

    if (event.target.classList.contains("save-btn")) {

        const task = tasks.find(function (task) {
            return String(task.id) === id;
        });

        const editInput =
            event.target.parentElement.querySelector(".edit-input");

        const editPriority =
            event.target.parentElement.querySelector(".edit-priority");

        if (!task || !editInput || !editPriority) {
            return;
        }

        const newText = editInput.value.trim();
        const newPriority = ["high", "medium", "low"].includes(editPriority.value)
         ? editPriority.value
         : "medium";

        if (newText === "") {
            editInput.focus();
            return;
        }

        const oldText = task.text;
        const oldPriority = task.priority;

        task.text = newText;
        task.priority = newPriority;

        if (!saveTasks()) {
            task.text = oldText;
            task.priority = oldPriority;
            return;
        }

        editingTaskId = null;

        renderTasks();
        return;
        }

    // Cancel Editing

    if (event.target.classList.contains("cancel-btn")) {
        editingTaskId = null;
        renderTasks();
        return;
    }


    // Delete Task

    if (event.target.classList.contains("delete-btn")) {

        const previousTasks = tasks;

        tasks = tasks.filter(function (task) {
        return String(task.id) !== id;
    });

    if (!saveTasks()) {
    tasks = previousTasks;
    return;
    }

    if (editingTaskId === id) {
    editingTaskId = null;
    }

    renderTasks();
    return;
    }


    // Complete or Uncomplete Task

    if (event.target.classList.contains("task-text")) {

        const task = tasks.find(function (task) {
            return String(task.id) === id;
        });

        if (task) {
    const previousStatus = task.completed;

    task.completed = !task.completed;

    if (!saveTasks()) {
        task.completed = previousStatus;
        return;
    }

    renderTasks();
    }
    }
    });


// ================================
// Keyboard Support
// ================================

taskList.addEventListener("keydown", function (event) {

    if (!event.target.classList.contains("edit-input")) {
        return;
    }


    // Enter = Save

    if (event.key === "Enter") {
        event.preventDefault();

        const saveBtn =
            event.target.parentElement.parentElement.querySelector(".save-btn");

        if (saveBtn) {
            saveBtn.click();
        }
    }


    // Escape = Cancel

    if (event.key === "Escape") {
        editingTaskId = null;
        renderTasks();
    }
});


// ================================
// Task Filters
// ================================

filterButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        currentFilter = button.dataset.filter;

        editingTaskId = null;

        filterButtons.forEach(function (btn) {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        renderTasks();
    });
});


// ================================
// Initial Render
// ================================

renderTasks();