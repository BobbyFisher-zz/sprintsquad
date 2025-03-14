// Debug utility functions
export const Debug = {
    enabled: false,
    
    init() {
        this.enabled = window.DEBUG || window.location.search.includes('debug=true');
        
        if (this.enabled) {
            console.log('Debug mode enabled');
            this.setupErrorHandling();
            this.createDebugPanel();
        }
    },
    
    log(message) {
        if (this.enabled) {
            console.log(`[DEBUG] ${message}`);
            this.addToDebugPanel(message);
        }
    },
    
    error(message, error) {
        console.error(`[ERROR] ${message}`, error);
        this.addToDebugPanel(`ERROR: ${message} - ${error?.message || error}`, 'error');
    },
    
    warn(message) {
        if (this.enabled) {
            console.warn(`[WARN] ${message}`);
            this.addToDebugPanel(`WARN: ${message}`, 'warning');
        }
    },
    
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            this.error(`Uncaught error: ${event.message}`, {
                message: `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Unhandled Promise rejection', event.reason);
        });
    },
    
    createDebugPanel() {
        let panel = document.getElementById('debug-panel');
        
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'debug-panel';
            panel.style.position = 'fixed';
            panel.style.bottom = '10px';
            panel.style.right = '10px';
            panel.style.width = '300px';
            panel.style.maxHeight = '200px';
            panel.style.overflowY = 'auto';
            panel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            panel.style.color = 'white';
            panel.style.fontFamily = 'monospace';
            panel.style.fontSize = '12px';
            panel.style.padding = '10px';
            panel.style.borderRadius = '5px';
            panel.style.zIndex = '9999';
            
            const header = document.createElement('div');
            header.textContent = 'DEBUG CONSOLE';
            header.style.fontWeight = 'bold';
            header.style.marginBottom = '5px';
            header.style.borderBottom = '1px solid white';
            panel.appendChild(header);
            
            const content = document.createElement('div');
            content.id = 'debug-content';
            panel.appendChild(content);
            
            const closeButton = document.createElement('button');
            closeButton.textContent = 'X';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '5px';
            closeButton.style.right = '5px';
            closeButton.style.background = 'none';
            closeButton.style.border = 'none';
            closeButton.style.color = 'white';
            closeButton.style.cursor = 'pointer';
            closeButton.onclick = () => {
                panel.style.display = 'none';
            };
            panel.appendChild(closeButton);
            
            document.body.appendChild(panel);
        }
        
        return panel;
    },
    
    addToDebugPanel(message, type = 'info') {
        const panel = document.getElementById('debug-panel');
        if (!panel) return;
        
        const content = document.getElementById('debug-content');
        if (!content) return;
        
        const entry = document.createElement('div');
        entry.textContent = message;
        
        // Style based on message type
        switch (type) {
            case 'error':
                entry.style.color = '#ff5555';
                break;
            case 'warning':
                entry.style.color = '#ffaa55';
                break;
            default:
                entry.style.color = '#aaffaa';
        }
        
        content.appendChild(entry);
        
        // Auto-scroll to bottom
        panel.scrollTop = panel.scrollHeight;
        
        // Limit entries
        while (content.children.length > 50) {
            content.removeChild(content.firstChild);
        }
    },
    
    inspectObject(obj, label = 'Object') {
        if (!this.enabled) return;
        
        console.group(label);
        console.dir(obj);
        console.groupEnd();
        
        this.addToDebugPanel(`Inspected ${label} (see console)`);
    }
}; 