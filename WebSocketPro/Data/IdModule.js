
module.exports = {
    MSGID: {
        EVENT_LOGIN_REQ: 1,  //  登陆的请求
        EVENT_LOGIN_REP: 2,  //  登陆的回复
        EVENT_ENTER_ROOM_REQ: 3,  //  进入房间的请求
        EVENT_ENTER_ROOM_REP: 4,  //  进入房间的回复
        EVENT_LEAVE_ROOM_REQ: 5,  //  离开房间的请求
        EVENT_LEAVE_ROOM_REP: 6,  //  离开房间的回复
        EVENT_SEND_MEG_REQ: 7,  //  发送消息的请求
        EVENT_SEND_MEG_REP: 8,  //  发送消息的回复
        EVENT_MESSAGE_PUSH: 9,  //  大厅服务器推送的消息
        EVENT_CREATE_ROOM_REQ: 10, //  创建房间
        EVENT_CREATE_ROOM_REP: 11, //  创建房间回复
        USER_ENTER_ROOM_PUSH: 12,  //  有玩家加入的推送
        USER_LEAVE_ROOM_PUSH: 13,  //  有玩家离开房间的推送
    },
    CODEID: {
        COMMONLY_ERROR_CODE: -1,  //  一般的错误code值
        SPECIAL_ERROR_CODE: -2,  //  特殊的错误code值
        RIGHT_CODE: 100,  //  正确的code值
    },
};
