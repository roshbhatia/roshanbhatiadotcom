document.addEventListener('DOMContentLoaded', function() {
    const term = new Terminal({
        cursorBlink: true,
        theme: {
            background: '#000',
            foreground: '#fff',
            cursor: '#fff'
        }
    });

    term.open(document.getElementById('terminal'));
    
    term.writeln('Welcome to Roshan Bhatia\'s terminal website!');
    term.writeln('Type "about" to learn more, or "help" for available commands.');

    const customCommands = {
        'about': () => {
            term.writeln('Roshan Bhatia - Software Engineer');
            term.writeln('GitHub: https://github.com/roshbhatia');
            term.writeln('LinkedIn: https://www.linkedin.com/in/roshan-bhatia-2b1970a7/');
            term.writeln('Last.fm: https://www.last.fm/user/rshnbhatia');
        },
        'clear': () => {
            term.clear();
        },
        'help': () => {
            term.writeln('Available commands:');
            term.writeln('  about - Display information about Roshan Bhatia');
            term.writeln('  clear - Clear the terminal screen');
            term.writeln('  help  - Display this help message');
        }
    };

    let currentLine = '';
    term.onKey(e => {
        const printable = !e.domEvent.altKey && !e.domEvent.ctrlKey && !e.domEvent.metaKey;

        if (e.domEvent.keyCode === 13) {
            term.write('\r\n');
            if (currentLine.trim() in customCommands) {
                customCommands[currentLine.trim()]();
            } else if (currentLine.trim() !== '') {
                term.writeln(`Command not found: ${currentLine}`);
            }
            currentLine = '';
            term.write('$ ');
        } else if (e.domEvent.keyCode === 8) {
            if (currentLine.length > 0) {
                currentLine = currentLine.slice(0, -1);
                term.write('\b \b');
            }
        } else if (printable) {
            currentLine += e.key;
            term.write(e.key);
        }
    });

    term.write('$ ');
});