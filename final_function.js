function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // 1. If it already contains index.html, STOP and return current request
    if (uri.indexOf('index.html') !== -1) {
        return request;
    }

    // 2. If it's a directory request (ends with /)
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    } 
    // 3. If it's a clean path without a file extension
    else if (uri.indexOf('.') === -1) {
        request.uri += '/index.html';
    }

    return request;
}
