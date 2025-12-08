window.addEventListener("DOMContentLoaded", function(){
    new Background().init(); //初始化background元素
    let sidebar = new Sidebar("/home.html");
    sidebar.bindSidebarSwitch("navigation_sidebar");
    new SessionsView().checkAccessToken();
    let storageController = new StorageController();
});

const storageIconMapping = {
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

const storageControlMapping = {
    "folder": ["fileEditButton","fileDeleteButton"],
    "file": ["fileEditButton","fileDeleteButton","fileDownloadButton"]
}

class StorageController{

    constructor(){
        // 数据
        this.storagesView = new StoragesView();

        // 初始化页面选择器
        this.pageSelect = new PageSelect("storage", 20);
        this.pageSelect.onPageChanged(this.updateFileList);
        this.pageSelect.onLimitChanged(this.updateFileList);
        this.pageSelect.onNextPage(this.updateFileList);
        this.pageSelect.onPreviousPage(this.updateFileList);

        // 初始化弹窗
        this.popupAddFolder = new PopupContainer("popupAddFolder");
        this.popupMessage = new PopupMessage();
        this.popupFileControl = new PopupContainerFloat("popupFileControl");
        this.popupEditFolder = new PopupContainer("popupEditFolder");
        this.popupUploadFile = new PopupContainer("popupUploadFile");
        this.popupDeleteConfirm = new PopupContainer("popupDeleteConfirm");
        this.popupEditFile = new PopupContainer("popupEditFile");

        // 初始化文件上传的控件
        this.formFileUpload = new FormFileUploader("uploadFileLoader");

        // 初始化页面
        this.checkParams();
        this.updateFileList();

        // 事件绑定
        this.init();
    }

    init(){
        this.bindCreateFolder();
        this.bindControlButton();
        this.bindEditFolder();
        this.bindUploadFile();
        this.bindDeleteConfirm();
        this.bindEditFile();
    }

    bindEditFile(){
        callElement("editFileCancel", element=>{
            element.addEventListener("click", (event)=>{
                this.popupEditFile.hideContainer();
            })
        });
        callElement("editFileForm", element=>{
            element.addEventListener("submit", (event)=>{
                this.onEditFile();
            })
        });
    }

    async onEditFile(){
        /*编辑文件*/
        let spinner = createSpinner("editFileConfirm");
        try{
            event?.preventDefault();
            let responseData = await this.storagesView.editFile(
                document.getElementById("editFileSelect")?.value,
                document.getElementById("editFilename")?.value,
                document.getElementById("editFileRemark")?.value,
                sessionStorage.getItem("nowFileID")
            )
            this.updateFileList();
            this.popupEditFile.hideContainer();
            document.getElementById("editFileForm")?.reset();
            this.popupMessage.displaySuccessMessage(responseData.message);
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
        }finally{
            spinner?.remove();
        }
    }

    bindDeleteConfirm(){
        callElement("deleteFileCancel", element=>{
            element.addEventListener("click", (event)=>{
                this.popupDeleteConfirm.hideContainer();
            });
        });
        callElement("deleteFileConfirm", element=>{
            element.addEventListener("click", async (event)=>{
                let spinner = createSpinner("deleteFileConfirm");
                try{
                    let fileType = this.getSuitFileType(sessionStorage.getItem("nowFileType"));
                    let nowFileID = sessionStorage.getItem("nowFileID");
                    let responseData = null;
                    if(fileType=="folder"){
                        responseData = await this.storagesView.deleteFolder(nowFileID);
                    }else{
                        responseData = await this.storagesView.deleteFile(nowFileID);
                    }
                    this.updateFileList();
                    this.popupDeleteConfirm.hideContainer();
                    this.popupMessage.displaySuccessMessage(responseData.message);
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        });
        callElement("fileDownloadButton", element=>{
            element.addEventListener("click", (event)=>{
                let nowFileID = sessionStorage.getItem("nowFileID");
                let accessToken = localStorage.getItem("accessToken");
                downloadFile(`${API_PREFIX}/storages/files/${nowFileID}/download?accessToken=${accessToken}`);
                this.popupFileControl.hideContainer();
            });
        });
    }

    bindUploadFile(){
        callElement("uploadFileButton", element=>{
            element.addEventListener("click",(event)=>{
                this.onClickUploadFile();
            });
        });
        callElement("uploadFileCancel", element=>{
            element.addEventListener("click",(event)=>{
                this.popupUploadFile.hideContainer();
            });
        });
        this.formFileUpload.bindOnDrop(()=>{
            if(this.formFileUpload.tempFile.length > 0){
                callElement("uploadFileName", element=>{
                    let name = this.formFileUpload.tempFile[0].name;
                    element.value = getFilename(name);
                });
            }
        });
        this.formFileUpload.bindOnClick(()=>{
            if(this.formFileUpload.tempFile.length > 0){
                callElement("uploadFileName", element=>{
                    let name = this.formFileUpload.tempFile[0].name;
                    element.value = getFilename(name);
                });
            }
        });
        callElement("uploadFileForm", element=>{
            element.addEventListener("submit", (event)=>{
                this.onUploadFile();
            })
        });
    }

    async onUploadFile(){
        /*点击上传文件*/
        let spinner = createSpinner("uploadFileConfirm");
        try{
            event?.preventDefault();
            let file = null;
            if(this.formFileUpload.tempFile.length > 0){
                file = this.formFileUpload.tempFile[0];
            }
            let responseData = await this.storagesView.addFile(
                file,
                document.getElementById("uploadFileName")?.value,
                document.getElementById("uploadFileSelect")?.value,
                document.getElementById("uploadFileRemark")?.value
            )
            this.updateFileList();
            this.popupUploadFile.hideContainer();
            this.formFileUpload.reset();
            document.getElementById("uploadFileForm")?.reset();
            this.popupMessage.displaySuccessMessage(responseData.message);
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
        }finally{
            spinner?.remove();
        }
    }

    async onClickUploadFile(){
        /*点击弹出上传文件窗口*/
        let spinner = createSpinner("uploadFileButton", "spinner-container", 0.75);
        try{
            let fileID = sessionStorage.getItem("fileID");
            let parentData = await this.storagesView.getFolderDetail(fileID);
            this.resetSelectFolder("uploadFileSelect", parentData);
            this.popupUploadFile.showContainer();
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
        }finally{
            spinner?.remove();
        }
    }

    bindEditFolder(){
        callElement("editFolderCancel", element=>{
            /*取消新增*/
            element.addEventListener("click", (event)=>{
                this.popupEditFolder.hideContainer();
            });
        });
        callElement("editFolderForm", element=>{
            /*确认编辑*/
            element.addEventListener("submit", this.onEditFolder);
        });
    }

    async onEditFolder(event){
        /*编辑文件夹*/
        let spinner = createSpinner("editFolderConfirm");
        try{
            event?.preventDefault();
            let responseData = await this.storagesView.editFolder(
                document.getElementById("editFolderSelect")?.value,
                document.getElementById("editFolderName")?.value,
                document.getElementById("editFolderRemark")?.value,
                sessionStorage.getItem("nowFileID")
            )
            this.updateFileList();
            this.popupEditFolder.hideContainer();
            document.getElementById("editFolderForm")?.reset();
            this.popupMessage.displaySuccessMessage(responseData.message);
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
        }finally{
            spinner?.remove();
        }
    }

    getSuitFileType(type){
        /*获取匹配的FileType*/
        if(!type){
            return "folder";
        }else{
            return "file";
        }
    }

    bindControlButton(){
        /*操作按钮事件绑定*/
        callElement("fileEditButton", element=>{
            element.addEventListener("click", (event)=>{
                let fileType = this.getSuitFileType(sessionStorage.getItem("nowFileType"));
                if(fileType=="folder"){
                    this.onClickEditFolder(event);
                }else{
                    this.onClickEditFile(event);
                }
            });
        });
        callElement("fileDeleteButton", element=>{
            element.addEventListener("click", (event)=>{
                this.popupFileControl.hideContainer();
                this.popupDeleteConfirm.showContainer();
            });
        });
    }

    async onClickEditFile(event){
        /*点击编辑文件*/
        let spinner = createSpinner("fileEditButton","spinner-container",0.75);
        try{
            let fileID = sessionStorage.getItem("nowFileID");
            let fileData = await this.storagesView.getFileDetail(fileID);
            let parentFolder = fileData.folders[0];
            let parentData = await this.storagesView.getFolderDetail(parentFolder.fileID);
            this.resetSelectFolder("editFileSelect", parentData);
            callElement("editFilename", element=>{
                element.value = fileData.filename;
            });
            callElement("editFileRemark", element=>{
                element.value = fileData.remark;
            });
            this.popupEditFile.showContainer();
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
        }finally{
            this.popupFileControl.hideContainer();
            spinner?.remove();
        }
    }

    async onClickEditFolder(event){
        /*点击编辑文件夹*/
        let spinner = createSpinner("fileEditButton","spinner-container",0.75);
        try{
            let folderID = sessionStorage.getItem("nowFileID");
            let folderData = await this.storagesView.getFolderDetail(folderID);
            let parentFolder = folderData.folders[0];
            let parentData = await this.storagesView.getFolderDetail(parentFolder.fileID);
            this.resetSelectFolder("editFolderSelect", parentData);
            callElement("editFolderName", element=>{
                element.value = folderData.filename;
            });
            callElement("editFolderRemark", element=>{
                element.value = folderData.remark;
            });
            this.popupEditFolder.showContainer();
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
        }finally{
            this.popupFileControl.hideContainer();
            spinner?.remove();
        }
    }

    onShowFileControl(){
        /*当操作弹窗显示时，调整显示项*/
        let nowFileType = this.getSuitFileType(sessionStorage.getItem("nowFileType"));
        for(let element of document.querySelectorAll("#popupFileControl .storage-control-list>*")){
            let elementID = element.id;
            if(elementID){
                if(storageControlMapping[nowFileType].includes(elementID)){
                    element.classList.remove("hidden");
                }else{
                    element.classList.add("hidden");
                }
            }
        }
    }

    async bindCreateFolder(){
        callElement("createFolderButton", element=>{
            /*显示新增文件夹弹窗*/
            element.addEventListener("click", async (event)=>{
                let spinner = createSpinnerByElement(element, "spinner-container", 0.75);
                try{
                    let folderID = sessionStorage.getItem("folderID") || "";
                    let folderData = await this.storagesView.getFolderDetail(folderID);
                    this.resetSelectFolder("addFolderSelect", folderData);
                    this.popupAddFolder.showContainer();
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
        callElement("addFolderForm", element=>{
            /*确认新增*/
            element.addEventListener("submit", async (event)=>{
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
                    document.getElementById("addFolderForm")?.reset();
                    this.popupMessage.displaySuccessMessage(responseData.message);
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        })
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
        let fileIconDiv = this.createFileIcon(storageIconMapping[fileType]);
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
        controlDiv.addEventListener("click", (event)=>{
            event.stopPropagation();
            storeSession("nowFileID",itemData.fileID);
            storeSession("nowFileType", itemData.type);
            this.onShowFileControl();
            this.popupFileControl.showContainer(event.pageX, event.pageY, "start", "end", 15);
        });

        if(itemData.remark && itemData.remark.trim() !== ""){
            let tooltip = document.createElement("div");
            tooltip.classList.add("storage-tooltip", "hidden");
            let tooltipText = document.createElement("div");
            tooltipText.classList.add("storage-tooltip-text");
            tooltipText.textContent = itemData.remark;
            tooltip.appendChild(tooltipText);
            fileItemDiv.appendChild(tooltip);
        }

        this.bindFileNameEvent(fileItemDiv, filenameDiv, itemData);
        this.bindFileItemEvent(fileItemDiv, itemData);
        return fileItemDiv;
    }

    bindFileNameEvent(fileItemDiv, filenameDiv, itemData){
        let timeoutEvent = null;
        let willShow = false;
        filenameDiv.addEventListener("mouseenter",(event)=>{
            timeoutEvent = setTimeout(()=>{
                willShow = true;
            }, 100);
        });
        filenameDiv.addEventListener("mousemove", debounce((event)=>{
            let tooltip = fileItemDiv.querySelector(".storage-tooltip");
            if(!tooltip || !tooltip.classList.contains("hidden") || !willShow){
                return;
            }
            let rect = fileItemDiv.getBoundingClientRect();
            let x = event.clientX - rect.left;
            let y = event.clientY - rect.top;
            tooltip.style.top = y + 8 + "px";
            if(event.clientX > window.innerWidth * 0.75){
                tooltip.style.left = x - 12 + "px";
                tooltip.style.transform = "translateX(-100%)";
            }else{
                tooltip.style.left = x + 12 + "px";
                tooltip.style.transform = "";
            }
            tooltip.classList.remove("hidden");
        }, 100));
        filenameDiv.addEventListener("mouseleave",(event)=>{
            willShow = false;
            let tooltip = fileItemDiv.querySelector(".storage-tooltip");
            if(tooltip){
                if(timeoutEvent){
                    clearTimeout(timeoutEvent);
                }
                tooltip.classList.add("hidden");
            }
        });
    }

    bindFileItemEvent(fileItemDiv, itemData){
        let fileType = itemData.type;
        //如果对特殊的文件类型如图片/视频/文本，则在else if中添加和实现
        if(fileType === null){
            fileItemDiv.addEventListener("click", (event)=>{
                storeSession("folderID", itemData.fileID);
                sessionStorage.removeItem("search");
                this.updateFileList();
            });
        }else{
            fileItemDiv.addEventListener("click", (event)=>{
                storeSession("nowFileID",itemData.fileID);
                storeSession("nowFileType", itemData.type);
                this.onShowFileControl();
                this.popupFileControl.showContainer(event.pageX, event.pageY, "start", "end", 15);
            });
        }
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