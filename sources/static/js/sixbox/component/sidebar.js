class Sidebar{
    constructor(href, bodyWidth=1024){
        this.initWithHref(href);
        this.bindOverlay(bodyWidth);
    }

    bindSidebarSwitch(switchId, closeIcon="/static/icons/window_close.png", openIcon="/static/icons/window_open.png"){
        /*绑定控制侧边栏展开关闭的按钮*/
        callElement(switchId, element=>{
            element.addEventListener("click", function(event){
                let overlay = document.querySelector(".sidebar-overlay");
                if(!overlay){
                    return;
                }
                event.stopPropagation();
                if (overlay.classList.contains("sidebar-hidden")){
                    overlay.classList.remove("sidebar-hidden");
                    document.querySelector(".sidebar-page")?.classList.add("sidebar-padding");
                    element.src = closeIcon;
                }else{
                    overlay.classList.add("sidebar-hidden");
                    document.querySelector(".sidebar-page")?.classList.remove("sidebar-padding");
                    element.src = openIcon;
                }
            });
        });
    }

    initWithHref(href){
        /*初始化*/
        let sidebarContent = document.querySelector(".sidebar-content");
        if(!sidebarContent){
            return;
        }
        for(let sidebarItem of sidebarContent.querySelectorAll(".sidebar-item")){
            let itemHref = sidebarItem.getAttribute("href");
            if (itemHref!=href){
                sidebarItem.addEventListener("click", function(){
                    window.location.href = itemHref;
                });
            }else{
                sidebarItem.classList.add("active");
                let sidebarText = sidebarItem.querySelector(".sidebar-text");
                sidebarText.classList.add("active");
            }
        }
        for(let sidebarGroup of sidebarContent.querySelectorAll(".sidebar-group")){
            let groupHead = sidebarGroup.querySelector(".sidebar-group-head");
            if(!groupHead){
                continue;
            }
            this.bindClickGroupHead(sidebarGroup, groupHead);
            for(let groupItem of sidebarGroup.querySelectorAll(".sidebar-group-item")){
                let itemHref = groupItem.getAttribute("href");
                if (itemHref!=href){
                    groupItem.addEventListener("click", function(){
                        window.location.href = itemHref;
                    });
                }else{
                    groupItem.classList.add("active");
                    sidebarGroup.querySelector(".sidebar-group-head")?.classList.add("active","expand");
                    sidebarGroup.querySelector(".sidebar-group-container")?.classList.add("active");
                    sidebarGroup.querySelector(".sidebar-group-head>.sidebar-text")?.classList.add("active");
                    let switchIcon = sidebarGroup.querySelector(".sidebar-switch>img");
                    if(switchIcon){
                        switchIcon.src="/static/icons/caret_downward.png";
                    }
                }
            }
        }
    }

    bindClickGroupHead(sidebarGroup, groupHead){
        /*侧边栏一级点击事件，展开/收起逻辑*/
        groupHead.addEventListener("click", function(){
            let container = sidebarGroup.querySelector(".sidebar-group-container");
            let switchIcon = groupHead.querySelector(".sidebar-switch>img");
            let headText = groupHead.querySelector(".sidebar-text");
            if(!container || !switchIcon || !headText){
                return;
            }
            if(container.classList.contains("active")){
                container.classList.remove("active");
                switchIcon.src = "/static/icons/caret_forward.png";
                groupHead.classList.remove("expand");
            }else{
                container.classList.add("active");
                switchIcon.src = "/static/icons/caret_downward.png";
                groupHead.classList.add("expand");
            }
        });
    }

    bindOverlay(bodyWidth){
        /*绑定overlay的点击事件，点击收起侧边栏*/
        document.body?.addEventListener("click", function(event){
            if(document.body.clientWidth>bodyWidth){
                return;
            }
            let overlay = document.querySelector(".sidebar-overlay");
            if (overlay && !overlay.contains(event.target) && !overlay.classList.contains("sidebar-hidden")) {
                overlay.classList.add("sidebar-hidden");
                event.stopPropagation();
                document.querySelector(".sidebar-page")?.classList.remove("sidebar-padding");
            }
        });
    }
}