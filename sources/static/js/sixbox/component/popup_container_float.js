class PopupContainerFloat{
    /*模态浮动弹窗，根据鼠标点击位置和内部内容决定位置*/
    constructor(containerID){
        this.containerID = containerID;
        this.isShow = false;
        this.observer = new ResizeObserver(throttle((entries) =>{
            for(let entry of entries){
                if(!entry.target.classList.contains("hidden")){
                    if(this.isShow){
                        entry.target.classList.add("hidden");
                        this.observer.unobserve(entry.target);
                        this.isShow=false;
                    }else{
                        this.isShow=true;
                    }
                }else{
                    this.isShow=false;
                }
            }
        },500));

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
                    popupOverlay.classList.add("hidden");
                }
                event.stopPropagation();
            });
        });
    }

    showContainer(startX, startY, xAlign="start", yAlign="start", padding=15){
        /*展示容器*/
        callElement(this.containerID, element=>{
            let popupOverlay = element.parentNode;
            if(!popupOverlay){
                return;
            }
            //向左移出页面显示范围
            popupOverlay.style.transform = "translateX(-100%)";
            //显示以加载出实际要显示的宽/高
            popupOverlay.classList.remove("hidden");
            //获取元素当前宽/高
            let elementWidth = element.offsetWidth;
            let elementHeight = element.offsetHeight;
            //获取窗口宽高
            let innerWidth = window.innerWidth;
            let innerHeight = window.innerHeight;
            //约束元素实际宽高
            if(elementWidth + padding*2 > innerWidth){
                element.style.width = (innerWidth - padding*2)+"px";
            }
            if(elementHeight + padding*2 > innerHeight){
                element.style.height = (innerHeight - padding*2)+"px";
            }
            //更新调整后的宽高
            elementWidth = element.offsetWidth;
            elementHeight = element.offsetHeight;
            //计算位置
            let x = (xAlign === "start")?(startX-elementWidth):(startX);
            let y = (yAlign === "start")?(startY-elementHeight):(startY);
            //调整位置
            if(x<0){
                x=padding;
            }else if(x > innerWidth-padding-elementWidth){
                x= innerWidth-padding-elementWidth;
            }
            if(y<0){
                y=padding;
            }else if(y > innerHeight-padding-elementHeight){
                y= innerHeight-padding-elementHeight;
            }
            //设置位置
            element.style.left = x + "px";
            element.style.top = y + "px";
            //向右移回页面显示范围
            popupOverlay.style.transform = "";
            this.observer.observe(element.parentNode);
        });
    }

    hideContainer(){
        /*收起容器*/
        callElement(this.containerID, element=>{
            let popupOverlay = element.parentNode;
            popupOverlay.classList.add("hidden");
            this.observer.unobserve(popupOverlay);
            this.isShow = false;
        });
    }

}