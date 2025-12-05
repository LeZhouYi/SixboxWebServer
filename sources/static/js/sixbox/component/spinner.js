function createSpinner(elementId, className="spinner-container", scale=1){
    /*创建loading*/
    let target = document.getElementById(elementId);
    return createSpinnerByElement(target, className, scale);
}

function createSpinnerByElement(elementTarget, className="spinner-container", scale=1){
    /*创建loading*/
    if(!elementTarget){
        return;
    }
    const computedRadius = adjustBorderRadius(elementTarget, 2);
    let spinner = document.createElement("div");
    spinner.style.borderRadius = computedRadius;
    spinner.classList.add(className);
    spinner.addEventListener("click", function(event){
        event.preventDefault();
        event.stopPropagation();
    });
    elementTarget.prepend(spinner);
    let spinnerInstance = new Spinner().spin(spinner);
    spinnerInstance.el.style.transform = `scale(${scale})`;
    return spinner;
}