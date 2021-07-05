class ListenerBuilder {
  listeners = {
    mousedown: new Map(),
    mouseup: new Map(),
    click: new Map(),
    keydown: new Map(),
    resize: new Map(),
    touchstart: new Map(),
    touchmove: new Map(),
    touchend: new Map(),
    vueClick: new Map(),
  };

  constructor() {
    Object.keys(this.listeners)
      .forEach((eventType) => {
        window.addEventListener(eventType, (event) => {
          this.listeners[eventType]
            .forEach((func) => func(event));
        });
      });
  }

  addListener(type, componentEl, listener) {
    this.listeners[type].set(componentEl, listener);
  }

  removeListener(type, componentEl) {
    if (this.listeners[type]) {
      this.listeners[type].delete(componentEl);
    }
  }

  onVueClick(event) {
    this.listeners.vueClick.forEach((func) => func(event));
  }
}

export default new ListenerBuilder();
