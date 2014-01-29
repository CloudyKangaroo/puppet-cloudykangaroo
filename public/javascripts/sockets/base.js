var socket = io.connect('http://localhost');

socket.emit("subscribe", { room: "global" });
socket.emit("subscribe", { room: "monitoring" });

socket.on('SYN', function (data, fn) {
  fn('ACK');
});
