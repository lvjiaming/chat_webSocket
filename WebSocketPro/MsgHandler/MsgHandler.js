
const MsgId = require('../Data/IdModule.js');
const uuid = require('node-uuid');
const WebSocket = require('ws');
const basePb = require('../proto/base_pb.js');

const MsgHandler = function (target) {
    this.target = target;
};
MsgHandler.prototype.handle = function (ws, data) {
    const event = data.msgId;
    const msgData = data.msgData;
    console.log(`收到的协议id为：${event}`);
    switch (event) {
        case MsgId.MSGID.EVENT_LOGIN_REQ: {  //  登陆成功
            this.addUser(ws);
            break;
        }
        case MsgId.MSGID.EVENT_ENTER_ROOM_REQ: {  //  进入房间
            this.enterRoom(ws, msgData);
            break;
        }
        case MsgId.MSGID.EVENT_LEAVE_ROOM_REQ: {  //  离开房间
            this.leaveRoom(ws, msgData);
            break;
        }
        case MsgId.MSGID.EVENT_SEND_MEG_REQ: {  //  发送消息
            this.sendMsg(ws, msgData);
            break;
        }
        case MsgId.MSGID.EVENT_CREATE_ROOM_REQ: {  //  创建房间
            this.createRoom(ws);
            break;
        }
    }
};
/**
 *  登陆，添加玩家
 * @param ws
 */
MsgHandler.prototype.addUser = function (ws) {
    let userHas = false;
    this.target.UserList.forEach((item) => {
        if (item.ws === ws) {
            userHas = true;
        }
    });
    if (userHas) {
        console.log(`用户已经存在`);
        const body = {
            msgId: MsgId.MSGID.EVENT_LOGIN_REP,
            msgData: {
                code: MsgId.CODEID.COMMONLY_ERROR_CODE,
                errorMsg: "重复登陆",
            },
        };
        sendMsg(ws, body);
    } else {
        const uid = uuid.v1();
        const nickName = getNickName(this.target.UserList);
        this.target.UserList.push({ws: ws, uid: uid, nickName: nickName});
        console.log(`添加新用户${nickName},UserList.length = ${this.target.UserList.length}`);
        const body = {
            msgId: MsgId.MSGID.EVENT_LOGIN_REP,
            msgData: {
                code: MsgId.CODEID.RIGHT_CODE,
                nickName: nickName,
            },
        };
        //  todo 运用proto协议的列子
        // const login = new basePb.Login_rep();
        // login.setId(parseInt(MsgId.MSGID.EVENT_LOGIN_REP));
        // login.setCode(parseInt(MsgId.CODEID.RIGHT_CODE));
        // login.setNickname(nickName);
        sendMsg(ws, body, MsgId.MSGID.EVENT_LOGIN_REP);
    }
};
/**
 *  创建房间
 * @param ws
 */
MsgHandler.prototype.createRoom = function (ws) {
      const roomId = parseInt(getRoomId());
      console.log(`房间号${roomId}`);
      let roomHas = false;
      this.target.roomList.forEach((item) => {
          if (item.roomId === roomId) {
              roomHas = true;
          }
      });
      if (roomHas) {
          console.log(`房间号${roomId}已存在，重新生成房间号`);
          this.createRoom(ws);
      } else {
          let creatorNickName;
          this.target.UserList.forEach((item) => {
              if (item.ws === ws) {
                  console.log(`将玩家${item.nickName}加入${roomId}号房间`);
                  creatorNickName = item.nickName;
                  this.target.roomList.push({roomId: roomId, users: [item], roomOwn: creatorNickName});
              }
          });
          const body = {
              msgId: MsgId.MSGID.EVENT_CREATE_ROOM_REP,
              msgData: {
                  code: MsgId.CODEID.RIGHT_CODE,
                  roomId: roomId,
                  roomOwn: creatorNickName,
                  userList: [creatorNickName],
              },
          };
          sendMsg(ws, body);
          const bodys = {
              msgId: MsgId.MSGID.EVENT_MESSAGE_PUSH,
              msgData: {
                  code: MsgId.CODEID.RIGHT_CODE,
                  mesNote: `玩家${creatorNickName}创建了房间${roomId}，快加入他们的聊天吧`,
              },
          };
          this.sendAllUser(bodys, ws);
      }
};
/**
 *  进房的处理
 * @param ws 发送的人
 * @param roomid 房间号
 */
MsgHandler.prototype.enterRoom = function (ws, roomid) {
    console.log(`收到的房间号${roomid}`);
    let msgNote = null;
    let hasRoom = false;
    if (typeof roomid != "number") {
        msgNote = "房间号不合法";
    }
    this.target.roomList.forEach((item) => {
        if (item.roomId === roomid) {
            hasRoom = true;
            item.users.push(this.target.getUser(ws));
            let userList = [];
            item.users.forEach((user) => {
                userList.push(user.nickName);
            });
            const body = {
                msgId: MsgId.MSGID.EVENT_ENTER_ROOM_REP,
                msgData: {
                    code: MsgId.CODEID.RIGHT_CODE,
                    data: {
                        roomId: roomid,
                        userList: userList,
                        roomOwn: item.roomOwn
                    }
                },
            };
            sendMsg(ws, body);
            const bodys = {
                msgId: MsgId.MSGID.USER_ENTER_ROOM_PUSH,
                msgData: {
                    code: MsgId.CODEID.RIGHT_CODE,
                    user: this.target.getUser(ws).nickName
                },
            };
            this.sendRoomAllUser(roomid, bodys, ws);
        }
    });
    if (!hasRoom) {
        msgNote = msgNote ? msgNote : "房间号不存在";
        const body = {
            msgId: MsgId.MSGID.EVENT_ENTER_ROOM_REP,
            msgData: {
                code: MsgId.CODEID.COMMONLY_ERROR_CODE,
                errorMsg: msgNote,
            },
        };
        sendMsg(ws, body);
    }
};
MsgHandler.prototype.leaveRoom = function (ws, data) {
    let hasSuc = false;
    this.target.roomList.forEach((item, roomindex) => {
        if (data.roomId === item.roomId) {
            item.users.forEach((user, index) => {
                if (user.ws === ws) {
                    console.log(`将房间${data.roomId}里${user.nickName}移除`);
                    hasSuc = true;
                    item.users.splice(index, 1);
                    const body = {
                        msgId: MsgId.MSGID.USER_LEAVE_ROOM_PUSH,
                        msgData: {
                            nickName: user.nickName,
                        }
                    };
                    if (item.users.length === 0) {
                        console.log(`房间${item.roomId}已无人，此房间自动解散`);
                        this.target.roomList.splice(roomindex, 1);
                    }
                    this.sendRoomAllUser(item.roomId, body, ws);
                }
            });
        }
    });
    let code;
    if (hasSuc) {
        code = MsgId.CODEID.RIGHT_CODE;
    } else {
        code = MsgId.CODEID.COMMONLY_ERROR_CODE;
    }
    const body = {
        msgId: MsgId.MSGID.EVENT_LEAVE_ROOM_REP,
        msgData: {
            code: code
        }
    }
    sendMsg(ws, body);
};
/**
 *  发送信息
 * @param ws
 * @param data 信息的内容
 */
MsgHandler.prototype.sendMsg = function (ws, data) {
    const body = {
        msgId: MsgId.MSGID.EVENT_SEND_MEG_REP,
        msgData: {
            code: MsgId.CODEID.RIGHT_CODE,
            sendUser: this.target.getUser(ws).nickName,
            sendNote: data.note,
        },
    };
    this.sendRoomAllUser(data.roomId, body)
};
/**
 *  获取昵称
 * @param userList 用户列表
 * @returns {string}
 */
const getNickName = function (userList) {
    let str = '用户';
    for (let i = 0; i < 5; i++) {
        if (i === 0) {
            str += Math.floor((Math.random() * 9) + 1);
        } else {
            str += Math.floor((Math.random() * 9) + 0);
        }
    }
    userList.forEach((item) => {
        if (str === item.nickName) {
            console.log(`昵称(${str})重复，重新生成新昵称`);
            getNickName(userList);
        }
    });
    return str;
};
/**
 *  随机生成一个房间号
 * @returns {string}
 */
const getRoomId = function () {
    let str = '';
    for (let i = 0; i < 6; i++) {
        if (i === 0) {
            str += Math.floor((Math.random() * 9) + 1);
        } else {
            str += Math.floor((Math.random() * 9) + 0);
        }
    }
    return str;
};
/**
 *  将消息发送给所有用户
 * @param data 数据
 * @param ws 当此数据传进来时，则便是向除了该用户以外的用户发送消息
 */
MsgHandler.prototype.sendAllUser = function (data, ws) {
    this.target.UserList.forEach((item) => {
        if (ws && ws === item.ws) {
            console.log(`不必向${item.nickName}发送消息`);
        } else {
            if (item.ws.readyState === WebSocket.OPEN) {
                item.ws.send(JSON.stringify(data));
            }
        }
    });
};
/**
 *  发送消息给指定房间的所有人
 * @param roomId  房间号
 * @param data 数据
 * @param ws 当此数据传进来时，则便是向除了该用户以外的用户发送消息
 */
MsgHandler.prototype.sendRoomAllUser = function (roomId, data, ws) {
    this.target.roomList.forEach((item) => {
        if (item.roomId === roomId) {
            item.users.forEach((user) => {
                if (ws && ws === user.ws) {
                    console.log(`不必向${user.nickName}发送消息`);
                } else {
                    if (user.ws.readyState === WebSocket.OPEN) {
                        user.ws.send(JSON.stringify(data));
                    }
                }
            });
        }
    });
};
/**
 *  单发消息
 * @param ws
 * @param data
 */
const sendMsg = function (ws, data, msgId) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
        return;
        //  todo  以下将协议id添加在uint8Array第一位
        const body = data.serializeBinary();
        const uint8 = new Uint8Array(body.length + 1);
        body.forEach((item, index) => {
            uint8[index + 1] = item;
        });
        uint8[0] = msgId;
        console.log(body, uint8);
        ws.send(uint8);
    }
};

module.exports = function (target) {
    if (!this.msgHanele) {
        console.log(`第一次初始化`);
        this.msgHanele = new MsgHandler(target);
    }
    return this.msgHanele;
};
