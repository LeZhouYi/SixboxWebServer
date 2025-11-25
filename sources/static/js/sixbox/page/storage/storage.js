window.addEventListener("DOMContentLoaded", function(){
    new Background().init(); //初始化background元素
    let sidebar = new Sidebar("/home.html");
    sidebar.bindSidebarSwitch("navigation_sidebar");
    new SessionsView().checkAccessToken();
    let storageController = new StorageController();
});

const iconMapping = {
    "": "/static/icons/folder.png",
    "pdf": "/static/icons/pdf.png"
}

const storageTexts = {
    "zh-CN":{
        "rootFolder":"根目录",
        "nowFolder":"当前目录",
        "childFolder":"子目录",
        "parentFolder": "父目录"
    }
}

class StorageController{

    constructor(){
        // 数据
        this.storagesView = new StoragesView();

        // 绑定
        this.checkParams = this.checkParams.bind(this);
        this.updateFileList = this.updateFileList.bind(this);
        this.updatePathBar = this.updatePathBar.bind(this);
        this.createFolderTextA = this.createFolderTextA.bind(this);
        this.createFileItem = this.createFileItem.bind(this);
        this.init = this.init.bind(this);
        this.bindCreateFolder = this.bindCreateFolder.bind(this);
        this.onAddFolder = this.onAddFolder.bind(this);

        // 初始化页面选择器
        this.pageSelect = new PageSelect("storage", 20);
        this.pageSelect.onPageChanged(this.updateFileList);
        this.pageSelect.onLimitChanged(this.updateFileList);
        this.pageSelect.onNextPage(this.updateFileList);
        this.pageSelect.onPreviousPage(this.updateFileList);

        // 初始化弹窗
        this.popupAddFolder = new PopupContainer("popupAddFolder");
        this.popupMessage = new PopupMessage();

        // 初始化页面
        this.checkParams();
        this.updateFileList();

        // 事件绑定
        this.init();
    }

    init(){
        this.bindCreateFolder();
    }

    async bindCreateFolder(){
        callElement("createFolderButton", element=>{
            /*显示新增文件夹弹窗*/
            element.addEventListener("click", async (event)=>{
                let spinner = createSpinnerByElement(element);
                try{
                    this.popupAddFolder.showContainer();
                    let folderID = sessionStorage.getItem("folderID") || "";
                    let folderData = await this.storagesView.getFolderDetail(folderID);
                    this.resetSelectFolder("addFolderSelect", folderData);
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        });
        callElement("addFolderCancel", element=>{
            /*取消新增*/
            element.addEventListener("click", (event)=>{
                this.popupAddFolder.hideContainer();
            });
        });
        callElement("addFolderConfirm", element=>{
            /*确认新增*/
            element.addEventListener("submit", this.onAddFolder);
        });
        callElement("addFolderForm", element=>{
            /*确认新增*/
            element.addEventListener("submit", this.onAddFolder);
        })
    }

    async onAddFolder(event){
        /*点击新增文件夹*/
        let spinner = createSpinner("addFolderConfirm");
        try{
            event?.preventDefault();
            let responseData = await this.storagesView.addFolder(
                document.getElementById("addFolderSelect")?.value,
                document.getElementById("addFolderName")?.value,
                document.getElementById("addFolderRemark")?.value
            );
            this.updateFileList();
            this.popupAddFolder.hideContainer();
            document.getElementById("addFolderForm").reset();
            this.popupMessage.displaySuccessMessage(responseData.message);
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
        }finally{
            spinner?.remove();
        }
    }

    resetSelectFolder(elementID, folderData){
        /*重置文件选择*/
        callElement(elementID, element=>{
            element.innerHTML = "";
            let lang = document.documentElement.lang || "zh-CN";
            let nowGroup = document.createElement("optgroup");
            nowGroup.label = storageTexts[lang]["nowFolder"];
            let nowOption = document.createElement("option");
            nowOption.text = folderData.filename || "";
            nowOption.value = folderData.fileID;
            nowGroup.appendChild(nowOption);
            element.appendChild(nowGroup);
            element.value = folderData.fileID;

            let parentGroup = document.createElement("optgroup");
            parentGroup.label = storageTexts[lang]["parentFolder"];
            for(let parentFolder of folderData.folders||[]){
                let parentOption = document.createElement("option");
                parentOption.text = parentFolder.filename;
                parentOption.value = parentFolder.fileID;
                parentGroup.appendChild(parentOption);
            }
            if(parentGroup.children.length > 0){
                element.appendChild(parentGroup);
            }

            let childGroup = document.createElement("optgroup");
            childGroup.label = storageTexts[lang]["childFolder"];
            for(let childFolder of folderData.contents){
                let childOption = document.createElement("option");
                childOption.text = childFolder.filename;
                childOption.value = childFolder.fileID;
                childGroup.appendChild(childOption);
            }
            if(childGroup.children.length > 0){
                element.appendChild(childGroup);
            }
        });
    }

    checkParams(){
        /*检查当前URL的参数*/
        this.pageSelect.checkParams();

        let url = new URL(window.location.href);
        let params = new URLSearchParams(url.search);
        let newParams = new URLSearchParams();
        addParams(newParams, "folderID", storeSession("folderID",params.get("folderID"), null));
        addParams(newParams, "_page", sessionStorage.getItem("_page"));
        addParams(newParams, "_limit", sessionStorage.getItem("_limit"));
        addParams(newParams, "search", storeSession("search",params.get("search"), null));
        url.search = newParams.toString();
        window.history.pushState({path:url.href},'',url.href);
    }

    async updateFileList(){
        /*更新文件列表*/
        let fileListContainer = document.querySelector(".storage-filelist");
        if(fileListContainer){
            fileListContainer.innerHTML = "";
        }
        let spinner = createSpinnerByElement(fileListContainer);
        try{
            let searchData = await this.storagesView.getStorageList();
            for(let contentItem of searchData.contents){
                fileListContainer.appendChild(this.createFileItem(contentItem));
            }
            this.pageSelect.updateParams(
                sessionStorage.getItem("_page"),
                sessionStorage.getItem("_limit"),
                searchData.total
            );
            this.updatePathBar(searchData);
            let url = new URL(window.location.href);
            url.search = this.storagesView.getUrlParams().toString();
            window.history.pushState({path:url.href},'',url.href);
            callElement("storageSearch", element=>{
                element.value = sessionStorage.getItem("search")|| "";
            });
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
        }finally{
            spinner?.remove();
        }
    }

    updatePathBar(searchData){
        /*更新文件路径*/
        let storagePathDiv = document.querySelector(".storage-path-bar>.storage-path-text");
        if(!storagePathDiv){
            return;
        }
        storagePathDiv.innerHTML = "";
        if(searchData && searchData.fileID){
            let folders = searchData.folders || [];
            for(let folderData of folders){
                let folderNameA = this.createFolderTextA(folderData.filename, folderData.fileID);
                let folderSeperator = document.createElement("a");
                folderSeperator.text = "/";
                storagePathDiv.appendChild(folderNameA);
                storagePathDiv.appendChild(folderSeperator);
            }
            let folderNameA = this.createFolderTextA(searchData.filename, searchData.fileID);
            storagePathDiv.append(folderNameA);
        }else{
            let lang = document.documentElement.lang || "zh-CN";
            let folderNameA = this.createFolderTextA(storageTexts[lang].rootFolder, null);
            storagePathDiv.append(folderNameA);
        }
    }

    createFolderTextA(folderName, id){
        /*创建路径元素并绑定点击事件*/
        let folderNameA = document.createElement("a");
        folderNameA.text = folderName || "";
        folderNameA.classList.add("storage-path-item");
        folderNameA.addEventListener("click", (event)=>{
            storeSession("folderID", id);
            sessionStorage.removeItem("search");
            this.updateFileList();
        });
        return folderNameA;
    }

    createFileItem(itemData){
        /*创建并附加文件/文件夹*/
        let fileType = itemData.type || "";

        //文件行
        let fileItemDiv = document.createElement("div");
        fileItemDiv.classList.add("storage-file-item");

        //文件图标
        let fileIconDiv = this.createFileIcon(iconMapping[fileType]);
        fileItemDiv.appendChild(fileIconDiv);

        //文件名
        let filenameDiv = this.createFileText(itemData.filename || "");
        fileItemDiv.appendChild(filenameDiv)

        //更新时间
        let editedTimeText = formatTimestamp(itemData.editedTime);
        let editedTimeDiv = this.createFileText(editedTimeText);
        fileItemDiv.appendChild(editedTimeDiv);

        //文件类型
        let fileTypeDiv = this.createFileText(fileType);
        fileItemDiv.appendChild(fileTypeDiv);

        //文件大小
        let fileSizeText = itemData.size?formatFileSize(itemData.size):"";
        let fileSizeDiv = this.createFileText(fileSizeText);
        fileItemDiv.appendChild(fileSizeDiv);

        //文件操作
        let controlDiv = this.createControlIcon();
        fileItemDiv.appendChild(controlDiv);

        if(fileType === ""){
            fileItemDiv.addEventListener("click", (event)=>{
                storeSession("folderID", itemData.fileID);
                sessionStorage.removeItem("search");
                this.updateFileList();
            });
        }

        return fileItemDiv;
    }

    createControlIcon(){
        /*添加控制图标*/
        let controlDiv = document.createElement("div");
        controlDiv.classList.add("storage-file-control");
        let img = document.createElement("img");
        img.src = "/static/icons/dots.png";
        controlDiv.appendChild(img);
        return controlDiv;
    }

    createFileText(text){
        /*创建文本*/
        let textDiv = document.createElement("div");
        textDiv.classList.add("storage-file-column");
        let textA = document.createElement("a");
        textA.classList.add("ellipsis");
        textA.textContent = text;
        textDiv.appendChild(textA);
        return textDiv;
    }

    createFileIcon(iconSrc){
        /*创建图标*/
        let fileIconDiv = document.createElement("div");
        fileIconDiv.classList.add("storage-file-icon");
        let fileIconImg = document.createElement("img");
        fileIconImg.src = iconSrc;
        fileIconDiv.appendChild(fileIconImg);
        return fileIconDiv;
    }

}