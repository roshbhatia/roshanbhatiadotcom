function newStack(worker, workerImageName, stackWorker, stackImageName) {
    let p2vbuf = {
        buf: new Uint8Array(0) // proxy => vm
    };
    let v2pbuf = {
        buf: new Uint8Array(0) // vm => proxy
    };
    var proxyConn = {
        sendbuf: p2vbuf,
        recvbuf: v2pbuf
    };
    var vmConn = {
        sendbuf: v2pbuf,
        recvbuf: p2vbuf
    }
    var proxyShared = new SharedArrayBuffer(12 + 4096);
    var certbuf = {
        buf: new Uint8Array(0),
        done: false
    }
    stackWorker.onmessage = connect("proxy", proxyShared, proxyConn, certbuf);
    stackWorker.postMessage({type: "init", buf: proxyShared, imagename: stackImageName});

    var vmShared = new SharedArrayBuffer(12 + 4096);
    worker.postMessage({type: "init", buf: vmShared, imagename: workerImageName});
    return connect("vm", vmShared, vmConn, certbuf);
}

function connect(name, shared, conn, certbuf) {
    var streamCtrl = new Int32Array(shared, 0, 1);
    var streamStatus = new Int32Array(shared, 4, 1);
    var streamLen = new Int32Array(shared, 8, 1);
    var streamData = new Uint8Array(shared, 12);
    var sendbuf = conn.sendbuf;
    var recvbuf = conn.recvbuf;
    let accepted = false;
    var httpConnections = {};
    var curID = 0;
    var maxID = 0x7FFFFFFF; // storable in streamStatus(signed 32bits)
    function getID() {
        var startID = curID;
        while (true) {
            if (httpConnections[curID] == undefined) {
                return curID;
            }
            if (curID >= maxID) {
                curID = 0;
            } else {
                curID++;
            }
            if (curID == startID) {
                return -1; // exhausted
            }
        }
    }
}

function appendData(data1, data2) {
    buf2 = new Uint8Array(data1.byteLength + data2.byteLength);
    buf2.set(new Uint8Array(data1), 0);
    buf2.set(new Uint8Array(data2), data1.byteLength);
    return buf2;
}
