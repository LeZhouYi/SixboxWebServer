class UsersView{
    getUserDetail(userID){
        /*获取用户详情*/
        return fetchJsonWithAuth("GET",`/users/${userID}`);
    }

    setBackground(userID, fileID){
        /*设置背景*/
        return fetchJsonWithAuth("PUT", `/users/${userID}/background`,{
            "background": fileID
        });
    }
}