class PopupContainer{
    /*模态弹窗基础*/

    constructor(containerID){
        this.containerID = containerID;
        this.init();
    }

    init(){
        /*初始化，绑定一些必要事件*/
        callElement(this.containerID, element=>{
            let popupOverlay = element.parentNode;
            popupOverlay?.addEventListener("click", (event)=>{
                this.checkWillHidden(event.target);
                event.stopPropagation();
            });
        });
    }

    checkWillHidden(target){
        /*判断是否在容器范围内*/
        callElement(this.containerID, element=>{
            if(!element.contains(target)){
                let popupOverlay = element.parentNode;
                popupOverlay?.classList.add("hidden");
            }
        });
    }

    showContainer(){
        /*展示容器*/
        callElement(this.containerID, element=>{
            let popupOverlay = element.parentNode;
            if(!popupOverlay){
                return;
            }
            popupOverlay.classList.remove("hidden");
        });
    }

    hideContainer(){
        /*收起容器*/
        callElement(this.containerID, element=>{
            let popupOverlay = element.parentNode;
            if(!popupOverlay){
                return;
            }
            popupOverlay.classList.add("hidden");
        });
    }

}