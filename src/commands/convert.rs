use serenity::prelude::*;
use serenity::model::channel::Message;
use serenity::framework::standard::*;

pub struct ConvertCommand;

impl Command for ConvertCommand {
    fn execute(&self, _ctx: &mut Context, msg: &Message, args: Args) -> Result<(), CommandError> {
        let mut args = args;
        let arch = if let Ok(arch) = args.single::<String>() {
            arch
        }
        else {
            error(msg, "could not parse arch argument"); 
            return Ok(());
        };

        let method = if let Ok(method) = args.single::<String>() {
            method
        }
        else {
            error(msg, "could not parse method argument"); 
            return Ok(());
        };

        let _ = msg.channel_id.say(format!("arch: {} method: {}", 
                                            arch, method));
        Ok(())
    }
}

fn error(msg: &Message, err: &str) {
    let _ = msg.channel_id.say(format!("error: {}", err));
}