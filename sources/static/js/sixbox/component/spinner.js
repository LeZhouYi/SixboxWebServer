function createSpinner(elementId, className="spinner-container"){
    /*创建loading*/
    let target = document.getElementById(elementId);
    return createSpinnerByElement(target, className);
}

function createSpinnerByElement(elementTarget, className="spinner-container"){
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
    new Spinner().spin(spinner);
    return spinner;
}