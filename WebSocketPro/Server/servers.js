/**
 * Created by Administrator on 2017/7/3.
 */

const WebSocketServer = require('ws');  //  npm 中的模块（webSocket）
const MsgHandle = require('../MsgHandler/MsgHandler.js');
const basePb = require('../proto/base_pb.js');
const wsServer = new WebSocketServer.Server({   //  设置ip 和 port
    host: "127.0.0.3",
    port: 3010
});
this.UserList = [];  //  用户列表
this.roomList = [];  //  房间列表
wsServer.on('connection', (ws) => {  //  注册连接上的事件
    console.log(`one client has connected`);
    ws.on('message', (message) => {  //  接收客户端的消息
        console.log(`has get meesage: ${message}`);
        const msgObj = JSON.parse(message);
        MsgHandle(this).handle(ws, msgObj);
    });
    ws.on('close', () => {
        this.removeUser(ws);
    });
});
wsServer.on('error', (err) => {
    console.log(`server has error: ${err}`);
});
wsServer.on('close', (ws) => {
    console.log(`server has close`);
});

/**
 *  获取指定玩家
 * @param ws
 */
this.getUser = function (ws) {
    let user;
    this.UserList.forEach((item) => {
        if (item.ws === ws) {
            user = item;
        }
    });
    console.log(`获取玩家${user.nickName}`);
    return user;
};
/**
 *  移除玩家
 * @param ws
 */
this.removeUser = function (ws) {
    this.UserList.forEach((user, index) => {
        if (user.ws === ws) {
            this.UserList.splice(index, 1);
            console.log(`将玩家${user.nickName}移除,UserList.length = ${this.UserList.length}`);
        }
    });
};
const getIp = function () {
    let obj = null;
    let rslt = "";
    try
    {
        obj = new ActiveXObject("rcbdyctl.Setting");
        rslt = obj.GetIPAddress;
        obj = null;
    }
    catch(e)
    {
        console.log(`错误信息：${e}`)
    }
    console.log(`ip地址为：${rslt}`);
    return rslt;
};
