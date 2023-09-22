const http = require('http');
const url = require('url');

const users = [
    { username: 'user1', password: 'password1' },
    { username: 'user2', password: 'password2' },
];
function logger(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello, World!\n');
}

function requestTimeoutMiddleware(timeoutMs) {
    return function (req, res) {
        const timeoutId = setTimeout(() => {
            res.writeHead(408, { 'Content-Type': 'text/plain' });
            res.end('Request Timeout\n');
        }, timeoutMs);

        // Clear the timeout if the request is completed before the timeout
        req.on('close', () => {
            clearTimeout(timeoutId);
        });

        // next();
    };
}

function authenticate(req, res, next) {
    const parsedUrl = url.parse(req.url, true);
    const { username, password } = parsedUrl.query;

    const AuthenticatedUser = users.find(
        (user) => user.username === username && user.password === password
    );

    if (AuthenticatedUser) {
        req.user = AuthenticatedUser;
        next();
    } else {
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Unauthorized');
    }
}

function errorHandler(err, req, res, next) {
    console.error(`Error: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error\n');
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (req.method === 'GET' && parsedUrl.pathname === '/') {
        logger(req, res);
    }

    else if (req.method === 'GET' && req.url === '/secure') {
        authenticate(req, res, () => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`Hello, ${req.user.username}! (Authenticated)\n`);
        });
    }

    else if (req.method === 'POST' && parsedUrl.pathname === '/post') {
        let requestBody = '';

        req.on('data', (chunk) => {
            requestBody += chunk.toString();
        });


        // When the entire request body has been received
        req.on('end', () => {
            try {
                // Parse the JSON data
                const jsonData = JSON.parse(requestBody);

                // Respond with the parsed data
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(jsonData));
            } catch (error) {
                // Handle JSON parsing errors
                errorHandler(err, req, res);
            }
        });

    }

    // Handle other requests
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found\n');
    }
});

const port = 8070;
const hostname = 'localhost';

server.on('request', requestTimeoutMiddleware(5000));

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
