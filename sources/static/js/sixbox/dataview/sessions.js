class SessionsView{
    login(username,password,deviceID){
        /*登录*/
        return fetchJson("POST","/sessions",{
            "username": username,
            "password": password,
            "deviceID": deviceID
        });
    }
    refreshToken(refreshToken){
        /*刷新Token*/
        return fetchJson("PUT","/sessions",{
            "refreshToken": refreshToken
        });
    }
}