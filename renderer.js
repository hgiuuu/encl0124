
const counter = document.getElementById('counter')

window.electronAPI.onGetAction((_event, value) => {

    window.location.href = value[0];
    
})