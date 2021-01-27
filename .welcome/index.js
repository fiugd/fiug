(async () => {

  if(typeof process === "undefined") return;

  const serviceName = 'Local Storage';
  const send = (message) => {
    if (process.send) {
      process.send(`${serviceName}: ${message}`);
    } else {
      console.log(message);
    }
  };

  process.on('message', parentMsg => {
    const _message = parentMsg + ' PONG.';
    send(_message);
  });

})();
