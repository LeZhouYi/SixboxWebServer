function createSpinner(elementId, className="spinner-container"){
    /*创建loading*/
    let target = document.getElementById(elementId);
    if (!target){
         return;
    }
    const computedRadius = adjustBorderRadius(target, 2);
    let spinner = document.createElement("div");
    spinner.style.borderRadius = computedRadius;
    spinner.classList.add(className);
    spinner.addEventListener("click", function(event){
        event.preventDefault();
        event.stopPropagation();
    });
    target.appendChild(spinner);
    new Spinner().spin(spinner);
    return spinner;
}