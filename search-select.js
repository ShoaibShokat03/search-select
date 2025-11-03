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

    // 🎨 Copy *visual* styles from select to input
    const copyProps = [
        "fontSize", "fontFamily", "fontWeight", "color",
        "backgroundColor", "border", "borderRadius", "padding",
        "outline", "boxShadow", "height", "lineHeight"
    ];
    copyProps.forEach(prop => {
        searchInput.style[prop] = computedStyle[prop];
    });

    searchInput.style.width = "100%";
    searchInput.style.marginBottom = "5px";
    searchInput.style.paddingRight = "30px";
    searchInput.style.cursor = "text";
    searchInput.style.boxSizing = "border-box";

    // 🔽 dropdown icon
    let icon = box.querySelector(".search-select-icon");
    if (!icon) {
        icon = document.createElement("span");
        icon.className = "search-select-icon";
        icon.innerHTML = "&#9662;";
        Object.assign(icon.style, {
            position: "absolute",
            right: "10px",
            top: "50%",
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
        maxHeight: "400px",
        minHeight: "auto",
        height: "auto",
        overflowY: "auto",
        border: "1px solid #ccc",
        background: "#fff",
        zIndex: "9999",
        display: "none",
        cursor: "pointer",
        boxSizing: "border-box"
    });

    // ⚡ force browser to calculate auto height correctly
    this.element.size = this.element.options.length > 10 ? 10 : this.element.options.length;

    this.element.setAttribute("multiple", true);

    // Event handlers (same as before) ↓
    if (!this._handlersAttached) {
        this._onFocus = () => {
            icon.style.display = "none";
            this.renderOptions(this.filteredOptions);
            this.element.style.display = this.filteredOptions.length ? "block" : "none";
        };

        this._onBlur = () => {
            setTimeout(() => {
                this.element.style.display = "none";
                icon.style.display = "block";
            }, 200);
        };

        this._onInput = () => {
            const query = searchInput.value.trim().toLowerCase();
            if (query === "") {
                this.filteredOptions = [...this.allOptions];
            } else {
                this.filteredOptions = this.allOptions.filter(opt =>
                    opt.text.toLowerCase().includes(query)
                );
            }
            this.renderOptions(this.filteredOptions);
            this.element.style.display = this.filteredOptions.length ? "block" : "none";
        };

        this._onChange = () => {
            const selected = Array.from(this.element.selectedOptions)
                .map(opt => opt.text)
                .join(", ");
            searchInput.value = selected;
        };

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
