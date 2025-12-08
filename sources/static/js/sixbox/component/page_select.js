const pageTexts = {
    "zh-CN":{
        "prefixText": "第",
        "postfixText": "页/共%s页",
        "limitText": "项/每页"
    }
}

class PageSelect{

    constructor(prefix, defaultLimit){
        this.prefix = prefix;
        this.defaultLimit = defaultLimit;
    }

    checkParams(){
        /*检查session的参数*/
        let params = new URLSearchParams(new URL(window.location.href).search);
        storeSession("_page",params.get("_page"), 0);
        storeSession("_limit",params.get("_limit"), this.defaultLimit);
        storeSession("total", params.get("total"), 0);
    }

    updateParams(page, limit, total){
        /*更新参数并设置到对应位置*/
        storeSession("_page", page, 0);
        storeSession("_limit", limit, this.defaultLimit);
        storeSession("total", total, 0);
        let lang = document.documentElement.lang || "zh-CN";

        callElement(this.prefix+"PrefixText", element=>{
            element.textContent = pageTexts[lang]["prefixText"]
        });
        callElement(this.prefix+"PageText", element=>{
            element.value = Number(page)+1;
        });
        callElement(this.prefix+"PostfixText", element=>{
            element.textContent = formatString(pageTexts[lang]["postfixText"], this.getMaxPage());
        });
        callElement(this.prefix+"Limit", element=>{
            element.value = limit;
        });
        callElement(this.prefix+"LimitText", element=>{
            element.textContent = pageTexts[lang]["limitText"];
        });
    }

    getMaxPage(){
        /*获取最大页数*/
        let total = Number(sessionStorage.getItem("_total") || 0);
        let limit = Number(sessionStorage.getItem("_limit") || this.defaultLimit);
        let maxPage = Math.ceil(total/limit);
        return maxPage == 0 ? 1 : maxPage;
    }

    #onPageChanged(func){
        /*当page input数值发生变化*/
        callElement(this.prefix+"PageText", element=>{
            let storePage =  Number(sessionStorage.getItem("_page") || 0);
            let nowPage = this.#getNowPage();
            if(nowPage!==undefined){
                nowPage = nowPage - 1;
                if(nowPage > -1 && nowPage!=storePage && nowPage<=this.getMaxPage()-1){
                    storeSession("_page", nowPage);
                    func?.();
                }
            }
            element.value = storePage+1;
        });
    }

    #getNowPage(){
        /*获取当前页数*/
        let nowPage = document.getElementById(this.prefix+"PageText")?.value;
        if(nowPage && nowPage.match(/^[\d]+$/g)){
            return Number(nowPage);
        }
        return undefined;
    }

    onPageChanged(func){
        /*绑定页数跳转Enter或者焦点丢失并且数据有变化的事件*/
        callElement(this.prefix+"PageText", element=>{
            element.addEventListener("keydown", (event) => {
                /*enter触发输入*/
                if(event.key === 'Enter' || event.keyCode === 13){
                    this.#onPageChanged(func);
                }
            });
            element.addEventListener("blur", (event) => {
                /*输入框焦点丢失*/
                this.#onPageChanged(func);
            });
        });
    }

    onLimitChanged(func){
        /*绑定每页项数据变化的事件*/
        callElement(this.prefix+"Limit", element=>{
            element.addEventListener("change", (event) => {
                /*数值发生变化时*/
                let nowLimit = Number(sessionStorage.getItem("_limit") || this.defaultLimit);
                let nowSelect = element.value;
                if(nowSelect && nowSelect!=nowLimit){
                    storeSession("_limit", nowSelect);
                    func?.();
                }
            });
        });
    }

    onNextPage(func){
        /*点击下一页*/
        callElement(this.prefix+"Next", element=>{
            element.addEventListener("click", (event) => {
                let storePage =  Number(sessionStorage.getItem("_page") || 0);
                let nowPage = this.#getNowPage();
                if(nowPage !== undefined){
                    nowPage = nowPage - 1;
                    if(nowPage > -1 && nowPage<=this.getMaxPage()-1){
                        storeSession("_page", nowPage);
                        element.value = nowPage;
                        func?.();
                    }
                }
            });
        });
    }

    onPreviousPage(func){
        /*点击上一页*/
        callElement(this.prefix+"Previous", element=>{
            element.addEventListener("click", (event)=>{
                let storePage = Number(sessionStorage.getItem("_page") || 0);
                let nowPage= this.#getNowPage();
                if(nowPage != undefined){
                    nowPage = nowPage - 1;
                    if(nowPage > 0 && nowPage<=this.getMaxPage()-1){
                        storeSession("_page", nowPage-1);
                        element.value = nowPage-1;
                        func?.();
                    }
                }
            });
        });
    }
}