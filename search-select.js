class searchSelect {
    constructor(selector, opts = {}) {
        this.element = typeof selector === "string"
            ? document.querySelector(selector)
            : selector;

        if (!this.element) {
            console.error("Element not found!");
            return;
        }

        this.pollInterval = opts.pollInterval || 100;
        this.pollTimeout = opts.pollTimeout || 5000;

        if (this.element.options.length > 1) {
            this._initFromDOM();
        } else {
            this.waitForOptions().then(() => this._initFromDOM()).catch(() => this._initFromDOM());
        }
    }

    waitForOptions() {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                if (this.element.options.length > 1) return resolve();
                if (Date.now() - start >= this.pollTimeout) return reject();
                this._waitTimer = setTimeout(check, this.pollInterval);
            };
            check();
        });
    }

    refresh() {
        this.allOptions = Array.from(this.element.options).map(opt => ({
            value: opt.value,
            text: opt.text
        }));
        this.filteredOptions = [...this.allOptions];
        if (this._searchInput && this._searchInput === document.activeElement) {
            this.renderOptions(this.filteredOptions);
            this.element.style.display = this.filteredOptions.length ? "block" : "none";
        } else {
            this.renderOptions(this.filteredOptions);
        }
    }

    _initFromDOM() {
        if (this._waitTimer) clearTimeout(this._waitTimer);

        this.allOptions = Array.from(this.element.options).map(opt => ({
            value: opt.value,
            text: opt.text
        }));
        this.filteredOptions = [...this.allOptions];

        if (this._initialized) return this.refresh();
        this._initialized = true;

        this.makeSearchable();
    }

    makeSearchable() {
        const box = document.createElement("div");
        box.className = "search-select-box";
        box.style.position = "relative";
        box.style.display = "inline-block";
        box.style.width = this.element.style.width || "250px";

        this.element.parentNode.insertBefore(box, this.element);
        box.appendChild(this.element);

        // Create search input
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.className = "search-select-input";
        searchInput.placeholder = "Type to search...";
        Object.assign(searchInput.style, {
            width: "100%",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            fontSize: "14px",
            outline: "none",
            cursor: "text",
            boxSizing: "border-box",
            color: "#333",
            transition: "all 0.2s ease"
        });
        box.insertBefore(searchInput, this.element);
        this._searchInput = searchInput;

        searchInput.addEventListener("focus", () => {
            searchInput.style.borderColor = "#007bff";
        });
        searchInput.addEventListener("blur", () => {
            searchInput.style.borderColor = "#ccc";
        });

        // style dropdown
        Object.assign(this.element.style, {
            position: "absolute",
            top: "100%",
            left: "0",
            width: "100%",
            maxHeight: "400px",
            height: "auto",
            overflowY: "auto",
            border: "1px solid #ccc",
            background: "#fff",
            zIndex: "9999",
            display: "none",
            cursor: "pointer",
            borderRadius: "5px",
            boxSizing: "border-box",
            marginTop: "3px"
        });

        // dynamic auto height
        this.element.size = this.element.options.length > 10 ? 10 : this.element.options.length;
        this.element.setAttribute("multiple", true);

        // Dropdown show/hide logic
        searchInput.addEventListener("focus", () => {
            this.renderOptions(this.filteredOptions);
            this.element.style.display = "block";
        });

        searchInput.addEventListener("blur", () => {
            setTimeout(() => (this.element.style.display = "none"), 200);
        });

        searchInput.addEventListener("input", () => {
            const query = searchInput.value.trim().toLowerCase();
            this.filteredOptions = this.allOptions.filter(opt =>
                opt.text.toLowerCase().includes(query)
            );
            this.renderOptions(this.filteredOptions);
            this.element.style.display = this.filteredOptions.length ? "block" : "none";
        });

        this.element.addEventListener("change", () => {
            const selected = Array.from(this.element.selectedOptions)
                .map(opt => opt.text)
                .join(", ");
            searchInput.value = selected;
            searchInput.style.background = selected ? "#e7f1ff" : "#fff";
        });
    }

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