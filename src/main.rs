extern crate capstone;
extern crate hex;

use std::io;
use capstone::prelude::*;

fn convert(hexstr: &String) -> CsResult<()> {
    let mut cs = Capstone::new()
        .arm()
        .mode(arch::arm::ArchMode::Arm)
        .build()?;
        
    let bytes = hex::decode(hexstr).unwrap();
    let instrs = cs.disasm_all(&bytes, 0x0)?;

    for i in instrs.iter() {
        let mnemonic = i.mnemonic().unwrap();
        let op_str = i.op_str().unwrap();

        println!("{} {}", mnemonic, op_str);
    }

    Ok(())
}

fn main() {
    let mut hexstr = String::new();

    println!("Enter instruction: ");
    if let Ok(_) = io::stdin().read_line(&mut hexstr) { 

		let hexstr = hexstr.replace("\n", "");

		if hexstr.is_empty() {
			panic!("No instr provided");
		}

		convert(&hexstr).expect("could not decode instruction");
	}
}
