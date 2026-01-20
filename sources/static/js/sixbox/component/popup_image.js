class PopupImage extends PopupContainer{

    constructor(containerID){
        super(containerID);
    }

    showImage(src){
        /*显示图片*/
        let container = document.getElementById(this.containerID);
        let popupImage = container?.querySelector(".popup-image");
        if(!src || !popupImage){
            return;
        }
        popupImage.innerHTML = "";
        let image = document.createElement("img");
        image.src = src;
        popupImage.appendChild(image);
        this.showContainer();
    }

    checkWillHidden(target){
        /*判断是否在容器范围内*/
        callElement(this.containerID, element=>{
            let child = element.querySelector(".popup-image");
            if(child && !child.contains(target)){
                let popupOverlay = element.parentNode;
                popupOverlay?.classList.add("hidden");
            }
        });
    }
}