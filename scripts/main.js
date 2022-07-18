class SocketMacros{
    static async execute(...args){
        const data = args[args.length-1];
        const macro = game.macros.get(data.id);
        //args.pop();
        if(!macro) return;
        macro.execute(...args);
    }

    static executeWrapper(wrapped, ...args){
        if(this.flags?.socketmacros?.isSocket && !args[args.length-1]?.fromSocket){
            SocketMacrosSocket.executeForOthers("execute",...args, {id: this.id, "fromSocket":true});
        }
        return wrapped(...args);
    }
}

//game.dnd5e.dice.damageRoll