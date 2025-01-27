export class StateManager {
    constructor() {
        this.state = {
            isLoading: false,
            currentWorkspaceId: null,
            error: null,
            progress: 0,
            results: null
        };
        this.listeners = new Set();
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notifyListeners();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }
} 