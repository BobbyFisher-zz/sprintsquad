export class Logger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.debugMode = false;
        this.loggingEnabled = true;
        
        // Check if debug mode is enabled via URL parameter
        if (window.location.search.includes('debug=true')) {
            this.debugMode = true;
            console.log('Debug mode enabled');
        }
    }
    
    setLoggingEnabled(enabled) {
        this.loggingEnabled = enabled;
        if (!enabled) {
            console.log('Logging disabled');
        } else {
            console.log('Logging enabled');
        }
    }
    
    log(message) {
        // Skip logging if disabled
        if (!this.loggingEnabled) {
            return;
        }
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            message
        };
        
        this.logs.push(logEntry);
        
        // Trim logs if they exceed the maximum
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Output to console in debug mode
        if (this.debugMode) {
            console.log(`[${timestamp}] ${message}`);
        }
    }
    
    getLogs() {
        return this.logs;
    }
    
    clearLogs() {
        this.logs = [];
    }
    
    downloadLog() {
        const logText = this.logs.map(entry => `[${entry.timestamp}] ${entry.message}`).join('\n');
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `game-log-${new Date().toISOString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}