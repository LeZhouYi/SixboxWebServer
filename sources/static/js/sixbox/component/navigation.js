class Navigation{

    constructor(){
        //初始化
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
        callElement("langSelect", element=>{
            element.value = document.documentElement.lang || "zh-CN";
            /*值发生改变*/
            element.addEventListener("change", (event)=>{
                setLanguage(element.value);
            });
        });
    }

}