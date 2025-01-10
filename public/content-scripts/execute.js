async function execute(operation, element, delay) {
    setTimeout(() => {
        switch (operation){
            case 'click':
                if(element){
                    console.log(element);
                    simulijs.simulateClick(element);
                }
                break;
        }
    }, delay);
}
