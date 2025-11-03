class searchSelect {
    constructor(selector, opts = {}) {
        this.element = typeof selector === "string"
            ? document.querySelector(selector)
            : selector;

        if (!this.element) {
            console.error("Element not found!");
            return;
        }

        // options
        this.pollInterval = opts.pollInterval || 100; // ms
        this.pollTimeout = opts.pollTimeout || 5000; // ms

        // If options already loaded (more than 1), init immediately
        if (this.element.options.length > 1) {
            this._initFromDOM();
        } else {
            // Otherwise wait (poll) until options are loaded, similar to "image load" behavior
            this.waitForOptions().then(() => {
                this._initFromDOM();
            }).catch(() => {
                // timed out — still attempt init with whatever is present
                this._initFromDOM();
            });
        }
    }

    // Public method: wait until select has more than 1 option (returns Promise)
    waitForOptions() {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                if (this.element.options.length > 1) {
                    return resolve();
                }
                if (Date.now() - start >= this.pollTimeout) {
                    return reject(new Error("waitForOptions: timeout"));
                }
                this._waitTimer = setTimeout(check, this.pollInterval);
            };
            check();
        });
    }

    // Public method: force refresh options from DOM (call this after your code updates options)
    refresh() {
        // update arrays from current DOM options
        this.allOptions = Array.from(this.element.options).map(opt => ({
            value: opt.value,
            text: opt.text
        }));
        // reset filtered to all
        this.filteredOptions = [...this.allOptions];
        // if dropdown is open, re-render it
        if (this._searchInput && this._searchInput === document.activeElement) {
            this.renderOptions(this.filteredOptions);
            this.element.style.display = this.filteredOptions.length ? "block" : "none";
        } else {
            // ensure the internal select reflects current options
            this.renderOptions(this.filteredOptions);
        }
    }

    // Internal init that pulls options and builds UI (only run once)
    _initFromDOM() {
        // clear any existing poll timer
        if (this._waitTimer) {
            clearTimeout(this._waitTimer);
            this._waitTimer = null;
        }

        // store options
        this.allOptions = Array.from(this.element.options).map(opt => ({
            value: opt.value,
            text: opt.text
        }));
        this.filteredOptions = [...this.allOptions];

        // Build UI only once — avoid double-wrapping if already initialized
        if (this._initialized) {
            this.refresh();
            return;
        }
        this._initialized = true;

        this.makeSearchable();
    }

    makeSearchable() {
        const computedStyle = window.getComputedStyle(this.element);

        // create or reuse wrapper box
        let box = this.element.closest(".search-select-box");
        if (!box) {
            box = document.createElement("div");
            box.classList.add("search-select-box");
            Object.assign(box.style, {
                position: "relative",
                display: "inline-block",
                width: computedStyle.width || "100%"
            });
            this.element.parentNode.insertBefore(box, this.element);
            box.appendChild(this.element);
        }

        // create search input (or reuse)
        let searchInput = box.querySelector("input.search-select-input");
        if (!searchInput) {
            searchInput = document.createElement("input");
            searchInput.className = "search-select-input";
            searchInput.type = "search";
            searchInput.placeholder = "Type to search...";
            box.insertBefore(searchInput, this.element);
        }
        this._searchInput = searchInput;

        // copy computed styles to input (safely)
        for (let i = 0; i < computedStyle.length; i++) {
            const prop = computedStyle[i];
            try {
                searchInput.style[prop] = computedStyle.getPropertyValue(prop);
            } catch (e) { /* ignore read-only props */ }
        }
        searchInput.style.width = "100%";
        searchInput.style.marginBottom = "5px";
        searchInput.style.paddingRight = "30px";
        searchInput.style.cursor = "text";

        // icon (create once)
        let icon = box.querySelector(".search-select-icon");
        if (!icon) {
            icon = document.createElement("span");
            icon.className = "search-select-icon";
            icon.innerHTML = "&#9662;";
            Object.assign(icon.style, {
                position: "absolute",
                right: "10px",
                top: "30%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "#555",
                fontSize: "14px"
            });
            box.appendChild(icon);
        }
        this._icon = icon;

        // style native select as floating dropdown
        Object.assign(this.element.style, {
            position: "absolute",
            top: "100%",
            left: "0",
            width: "100%",
            maxHeight: "200px",
            overflowY: "auto",
            border: "1px solid #ccc",
            background: "#fff",
            zIndex: "9999",
            display: "none"
        });
        this.element.setAttribute("multiple", true);
        this.element.style.cursor = "pointer";
        this.element.style.height="auto";

        // event handlers (use named handlers so refresh doesn't attach duplicates)
        if (!this._handlersAttached) {
            // focus -> show dropdown with current filteredOptions
            this._onFocus = () => {
                icon.style.display = "none";
                this.renderOptions(this.filteredOptions);
                this.element.style.display = this.filteredOptions.length ? "block" : "none";
            };

            // blur -> hide dropdown after small delay
            this._onBlur = () => {
                setTimeout(() => {
                    this.element.style.display = "none";
                    icon.style.display = "block";
                }, 200);
            };

            // input -> filter
            this._onInput = () => {
                const query = searchInput.value.trim().toLowerCase();
                if (query === "") {
                    this.filteredOptions = [...this.allOptions];
                    this.renderOptions(this.filteredOptions);
                    this.element.style.display = this.filteredOptions.length ? "block" : "none";
                    return;
                }
                this.filteredOptions = this.allOptions.filter(opt =>
                    opt.text.toLowerCase().includes(query)
                );
                this.renderOptions(this.filteredOptions);
                this.element.style.display = this.filteredOptions.length ? "block" : "none";
            };

            // change -> update input value with selected
            this._onChange = () => {
                const selected = Array.from(this.element.selectedOptions)
                    .map(opt => opt.text)
                    .join(", ");
                searchInput.value = selected;
            };

            // keys -> Enter toggles first, Escape hides
            this._onKeydown = (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    const firstVisible = this.element.options[0];
                    if (firstVisible) {
                        firstVisible.selected = !firstVisible.selected;
                        this.element.dispatchEvent(new Event("change"));
                    }
                } else if (e.key === "Escape") {
                    this.element.style.display = "none";
                    icon.style.display = "block";
                    searchInput.blur();
                }
            };

            searchInput.addEventListener("focus", this._onFocus);
            searchInput.addEventListener("blur", this._onBlur);
            searchInput.addEventListener("input", this._onInput);
            searchInput.addEventListener("keydown", this._onKeydown);
            this.element.addEventListener("change", this._onChange);

            this._handlersAttached = true;
        }
    }

    // Render the given options array into the select
    renderOptions(options) {
        this.element.innerHTML = "";
        for (const opt of options) {
            const optionEl = document.createElement("option");
            optionEl.value = opt.value;
            optionEl.text = opt.text;
            this.element.appendChild(optionEl);
        }
    }
}