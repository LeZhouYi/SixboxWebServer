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
}