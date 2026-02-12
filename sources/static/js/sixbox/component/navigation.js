class Navigation{

    constructor(){
        //初始化弹窗
        this.popupSetting = new PopupContainerFloat("popupSetting");

        //事件绑定
        this.bindSetting();
    }

    bindSetting(){
        callElement("navigationSetting", element=>{
            /*点击弹出设置页面*/
            element.addEventListener("click", (event)=>{
                this.popupSetting.showContainer(event.pageX, event.pageY, "start", "end", 15);
            });
        });
    }

}