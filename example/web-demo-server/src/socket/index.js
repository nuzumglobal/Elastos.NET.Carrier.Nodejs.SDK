//only for carrier for now
import _ from 'lodash';
import md5 from 'md5';
import CarrierPool from '../service/CarrierPool';


const F = {
    obj : null,
    ready : false,
    IO : null,

    queue : {},

    init(socketInstance, IO){

        F.obj = socketInstance;
        F.ready = true;
        F.IO = IO;

        F.build();
    },

    build(){
        const ela = F.obj.handshake.query.ela;

        F.obj.join(md5(ela), ()=>{
            let rooms = _.keys(F.obj.rooms);
            console.log(rooms); // [ <socket.id>, 'room 237' ]
        });

        F.obj.on('disconnect', function(){
            // here this means the real socket instance
            F.closeSocket(this.handshake.query.ela);
        });

        F.obj.on('error', (...args)=>{
            console.log('[error]', ...args);
        })
    },

    closeSocket(ela){
        F.IO.to(ela).clients((err, clients)=>{
            console.log('room '+ela+' disconnect');
            console.log(err, clients);
            if(clients.length < 1){
                CarrierPool.destroyInstance(ela);

            }
        })
    },


    send(roomId, msg, param){
        if(F.ready){
            const q = F.queue[roomId];
            if(q){
                _.each(q, (item)=>{
                   F.IO.to(roomId).emit(item.msg, item.param);
                });
                F.queue[roomId] = null;
            }

            // F.obj.emit(msg, param);
            F.IO.to(roomId).emit(msg, param);
        }
        else{
            // insert to queue
            if(!F.queue[roomId]){
                F.queue[roomId] = [];
            }

            F.queue[roomId].push({
                msg,
                param
            });
        }
    }

};

export default F;