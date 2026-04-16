function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // 1. If it's a directory request (ends with /)
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    } 
    // 2. If it's a clean path without a file extension (like /panel or /panel/dashboard)
    // AND it doesn't already end with index.html
    else if (!uri.includes('.') && !uri.endsWith('index.html')) {
        request.uri += '/index.html';
    }

    return request;
}
