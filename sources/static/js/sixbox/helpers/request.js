const API_PREFIX = "/api/v1";
const ERROR_CODE = [400,401];

async function getResponseJson(response){
    /*提取response的content并转为json*/
    let statusCode = response.status;
    if (!response.ok) {
        if (ERROR_CODE.includes(statusCode)) {
            let data = await response.json();
            throw new Error(data.message);
        }
        throw new Error(`HTTP ERROR: ${statusCode}`);
    } else {
        const data = await response.json();
        return data;
    }
}

async function fetchJson(method, url, jsonData={}) {
    /*fetch传json数据并获取json数据*/
    let response = null;
    if(method==="GET"){
        response = await fetch(API_PREFIX + url, {
            "method": method
        });
    }else{
        response = await fetch(API_PREFIX + url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify(jsonData)
        });
    }
    return getResponseJson(response);
}

async function fetchWithRetry(requestFunc, retryTimes = 1) {
    /*出现401则重试，成功则返回response*/
    while(retryTimes){
        let response = await requestFunc();
        if (response.ok){
            return response;
        }else if (response.status === 401 && retryTimes) {
            retryTimes = retryTimes - 1;
            let tokenResponse = await new SessionsView().refreshToken(localStorage.getItem("refreshToken"));
            if(tokenResponse.ok){
                localStorage.setItem("refreshToken",tokenResponse.refreshToken);
                localStorage.setItem("accessToken",tokenResponse.accessToken);
            }
        }else{
            let statusCode = response.status;
            if (ERROR_CODE.includes(statusCode)) {
                let data = await response.json();
                throw new Error(data.message);
            }
            throw new Error(`HTTP ERROR: ${statusCode}`);
        }
    }
}

async function fetchJsonWithAuth(method, url, jsonData={}) {
    /*fetch传json数据并获取json数据*/
    let fetchFunc = async function(){
        if(method==="GET"){
            return fetch(API_PREFIX + url, {
                "method": method,
                "headers": {
                    "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                }
            });
        }
        return fetch(API_PREFIX + url, {
            "method": method,
            "headers": {
                "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                "Content-Type": "application/json"
            },
            "body": JSON.stringify(jsonData)
        });
    };
    const response = await fetchWithRetry(fetchFunc);
    return getResponseJson(response);
}

async function fetchFormWithAuth(method, url, formData){
    /*fetch传输form-data数据并获取json数据*/
    let fetchFunc = async function(){
        return fetch(API_PREFIX+url, {
            "method": method,
            "headers":{
                "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
            },
            "body": formData
        })
    }
    const response = await fetchWithRetry(fetchFunc);
    return getResponseJson(response);
}