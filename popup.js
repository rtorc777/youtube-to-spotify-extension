document.getElementById('sign-in').addEventListener('click', () => {
    chrome.runtime.sendMessage({ message: 'login' }, function (response) {
        if (response.message === 'success') {
            window.close();
        } 
    });
});