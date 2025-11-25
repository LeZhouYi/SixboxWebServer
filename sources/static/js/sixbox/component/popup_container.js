class PopupContainer{
    /*模态弹窗基础*/

    constructor(containerID){
        this.containerID = containerID;

        this.init = this.init.bind(this);
        this.showContainer = this.showContainer.bind(this);
        this.hideContainer = this.hideContainer.bind(this);

        this.init();
    }

    init(){
        /*初始化，绑定一些必要事件*/
        callElement(this.containerID, element=>{
            let popupOverlay = element.parentNode;
            if(!popupOverlay){
                return;
            }
            popupOverlay.addEventListener("click", (event)=>{
                if(!element.contains(event.target)){
                    popupOverlay.classList.add("popup-hidden");
                }
                event.stopPropagation();
            });
        });
    }

    showContainer(){
        /*展示容器*/
        callElement(this.containerID, element=>{
            let popupOverlay = element.parentNode;
            if(!popupOverlay){
                return;
            }
            popupOverlay.classList.remove("popup-hidden");
        });
    }

    hideContainer(){
        /*收起容器*/
        callElement(this.containerID, element=>{
            let popupOverlay = element.parentNode;
            if(!popupOverlay){
                return;
            }
            popupOverlay.classList.add("popup-hidden");
        });
    }

}