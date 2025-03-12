export class Logger {
    constructor() {
        this.logs = [];
        this.loggingEnabled = true;
    }

    setLoggingEnabled(enabled) {
        this.loggingEnabled = enabled;
    }

    log(message) {
        if (this.loggingEnabled) {
            const timestamp = new Date().toISOString();
            this.logs.push(`[${timestamp}] ${message}`);
        }
    }

    downloadLog() {
        const blob = new Blob([this.logs.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'sprint-squad-log.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}