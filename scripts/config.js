Hooks.once('init', async function() {

    libWrapper.register(
        "socketmacros",
        "Macro.prototype.execute",
        SocketMacros.executeWrapper,
        "MIXED"
      );

});

Hooks.once('ready', async function() {

});

let SocketMacrosSocket;

Hooks.once("socketlib.ready", () => {
    SocketMacrosSocket = socketlib.registerModule("socketmacros");
    SocketMacrosSocket.register("execute", SocketMacros.execute);
});

Hooks.on("renderMacroConfig", (app,html)=>{

    const isSocket = app.object.getFlag("socketmacros", "isSocket");
    const checkbox = `
    <div class="form-group">
            <label>Execute on all Clients?</label>
            <input type="checkbox" name="flags.socketmacros.isSocket" data-dtype="Boolean" ${isSocket ? "checked" : ""}>
        </div>
    `

    html.find(`select[name="type"]`).closest(".form-group").after(checkbox);
});