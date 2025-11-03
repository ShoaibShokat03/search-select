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
        // wrapper
        const box = document.createElement("div");
        box.className = "search-select-box";
        Object.assign(box.style, {
            position: "relative",
            display: "inline-block",
            width: getComputedStyle(this.element).width || "100%"
        });

        this.element.parentNode.insertBefore(box, this.element);
        box.appendChild(this.element);

        // create search input
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.className = "search-select-input";
        searchInput.placeholder = "Type to search...";
        box.insertBefore(searchInput, this.element);
        this._searchInput = searchInput;

        // copy all visible styles from select
        const selectStyles = window.getComputedStyle(this.element);
        const copyProps = [
            "fontSize", "fontFamily", "fontWeight", "color", "backgroundColor",
            "border", "borderRadius", "padding", "outline", "boxShadow",
            "height", "lineHeight", "width"
        ];
        copyProps.forEach(prop => {
            searchInput.style[prop] = selectStyles[prop];
        });
        searchInput.style.boxSizing = "border-box";

        // dropdown styling
        Object.assign(this.element.style, {
            position: "absolute",
            top: "100%",
            left: "0",
            width: "100%",
            height: "auto",
            maxHeight: "400px",
            overflowY: "auto",
            border: "1px solid #ccc",
            background: "#fff",
            zIndex: "9999",
            display: "none",
            cursor: "pointer"
        });

        this.element.setAttribute("multiple", true);

        // show dropdown
        searchInput.addEventListener("focus", () => {
            this.renderOptions(this.filteredOptions);
            this.element.style.display = "block";
        });

        // hide dropdown
        searchInput.addEventListener("blur", () => {
            setTimeout(() => (this.element.style.display = "none"), 200);
        });

        // filter logic
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.trim().toLowerCase();
            this.filteredOptions = this.allOptions.filter(opt =>
                opt.text.toLowerCase().includes(query)
            );
            this.renderOptions(this.filteredOptions);
            this.element.style.display = this.filteredOptions.length ? "block" : "none";
        });

        // selection update
        this.element.addEventListener("change", () => {
            const selected = Array.from(this.element.selectedOptions)
                .map(opt => opt.text)
                .join(", ");
            searchInput.value = selected;
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
