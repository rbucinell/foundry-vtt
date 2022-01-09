let renderInlineRoll = function( roll )
{
	let rollJSONstr = encodeURI(JSON.stringify(roll.toJSON()));
	console.log( rollJSONstr);
	rollJSONstr='';
	const faDice = `fa-dice${attackRoll.terms.find( t => t instanceof Die ).faces === 20?'-20':''}`;
	
	return 
	`<a class="inline-roll inline-result" title="${roll.formula}" data-roll="${rollJSONstr}">
		<i class="fas ${faDice}" /> ${roll.total}
	</a>`;
}


/**
*	attacker: Actor5e
	target: Actor5e
	weapon: Item53 (of type='weapon')
**/
let makeAttak = async function( attacker, weapon )
{
	if( attacker === undefined)
	{
		ui.notifications.error( `No attacker, not sure how you messed that one up` );
		return;
	}
	
	let dex = attacker.data.data.abilities.dex;
	
	//Make an attack roll
	let attackRoll = new Roll("1d20kh + @prof + @dexMod + @weaponBonus", { 
		prof: attacker.data.data.prof.flat, 
		dexMod: dex.mod,
		weaponBonus: weapon.data.data.attackBonus
	});
	
	await attackRoll.evaluate(async=true);
	let isNat20 = attackRoll.terms[0].results[0].result === 20;
	let isNat1  = attackRoll.terms[0].results[0].result === 1;	
	let critStr = '';
	if( isNat20 )
	{
		critStr = '+ 6'; //We are playing max roll on crit
		if( weapon.name.includes('Vicious') )
		{
			critStr = '+ 2d6'
		}
	}
	let damageRoll = new Roll(`1d6 + ${dex.mod} ${critStr}`);
	
	await damageRoll.evaluate(async=true);
	
	return {
		attack: attackRoll,
		isNat20: isNat20,
		isNat1: isNat1,
		damage: damageRoll
	}
}

let ossu = game.user.character;

let viciousScimitar = ossu.data.items.find( item => item.data.name === 'Vicious Scimitar' );
let regularScimitar = ossu.data.items.find( item => item.data.name === 'Scimitar' );

let mainhand = await makeAttak( ossu, viciousScimitar );
let offhand  = await makeAttak( ossu, regularScimitar );

ChatMessage.create({ content:
    `Mainhand attack 
    <a class="inline-roll inline-result" title="1d20"><i class="fas fa-dice-d20"></i>${mainhand.attack.total}</a> dealing 
    <a class="inline-roll inline-result" title="1d6"><i class="fas fa-dice-six"></i>${mainhand.damage.total}</a> damage. 
    <br> 
    Offhand attack 
    <a class="inline-roll inline-result" title="1d20"><i class="fas fa-dice-d20"></i>${offhand.attack.total}</a> dealing 
    <a class="inline-roll inline-result" title="1d6"><i class="fas fa-dice-six"></i>${offhand.damage.total}</a> damage`});
//ChatMessage.create({ content:`Mainhand attack ${renderInlineRoll(mainhand.attack)} dealing ${renderInlineRoll(mainhand.damage)} damage. Offhand attack <a class="inline-roll inline-result" title="1d20"><i class="fas fa-dice-d20"></i>${offhand.attack.total}</a> dealing <a class="inline-roll inline-result" title="1d6"><i class="fas fa-dice-six"></i>${offhand.damage.total}</a> damage`});