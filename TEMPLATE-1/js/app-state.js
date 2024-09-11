class AppState extends HTMLElement {
    #state = null
    get state() {
        return this.#state;
    }
    connectedCallback() {
        const data = ftd.component_data(this);

        this.#state = Object.fromEntries(
            Object.entries(data).map(([key, module]) => {
                return [key, !(module instanceof MutableVariable) ? module.get() : module]
            }));
    }
}

if(!customElements.get('app-state')) {
    customElements.define('app-state', AppState);
}
