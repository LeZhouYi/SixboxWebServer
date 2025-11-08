class UsersView{
    getUserDetail(userID){
        /*获取用户详情*/
        return fetchJsonWithAuth("GET",`/users/${userID}`);
    }
}