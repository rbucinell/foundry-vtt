/**
 * Renders the provided roll as an inline anchor tag
 * 
 * @param {Roll} roll The evaulated roll to inject into the display
 * @returns complied HTML for a Chat Message 
 */
let renderInlineRoll = function( roll )
{
	let encodedJSON = encodeURI(JSON.stringify(roll.toJSON()));
	const faDice = `fa-dice${roll.terms.find( t => t instanceof Die ).faces === 20?'-d20':''}`;
    console.log( faDice );
	return `<a class="inline-roll inline-result" data-roll=${encodedJSON} title="${roll.formula}"><i class="fas ${faDice}"></i>${roll.total}</a>`
}

/**
 * Makes attack and damage rolls for an attack.
 * 
 * @param {Actor5e} attacker The attacking actor
 * @param {Item} weapon the weapon (currently locked to scimitar stats)
 * @returns {object} - contains rolls and Nat1/20 flags
 */
let makeAttack = async function( attacker, weapon )
{
	if( attacker === undefined)
	{
		ui.notifications.error( `No attacker, not sure how you messed that one up` );
		return;
	}
	
	let dex = attacker.data.data.abilities.dex;
	
	//Make an attack roll
    let attackFormula = "1d20kh + @prof + @dexMod + @weaponBonus";
	let attackRoll = new Roll(attackFormula, { 
		prof: attacker.data.data.prof.flat, 
		dexMod: dex.mod,
		weaponBonus: weapon.data.data.attackBonus
	});
    attackRoll.creationFormula = attackFormula;
	
	await attackRoll.evaluate({async:true});
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
    let damageFormula = "1d6 + @dexMod + @critBonus";
	let damageRoll = new Roll(damageFormula,{
        dexMod: dex.mod,
        critBonus: critStr
    });
    damageRoll.creationFormula = damageFormula;
	
	await damageRoll.evaluate({async:true});
	
	return {
		attack: attackRoll,
		isNat20: isNat20,
		isNat1: isNat1,
		damage: damageRoll
	}
}

let ossu = game.user.character;
let weapon = null, weapon2 = null;

//Cause I'm lazy and just want to ctrl+a,ctrl+c,ctrl+v
if( location.href === 'https://demo.foundryvtt.com/game' )
{
    weapon  = ossu.data.items.find( item => item.data.type === 'weapon');
    weapon2 = ossu.data.items.find( item => item.data.type === 'weapon');
}
else
{
    weapon  = ossu.data.items.find( item => item.data.name === 'Vicious Scimitar' );
    weapon2 = ossu.data.items.find( item => item.data.name === 'Scimitar' );
}
let mainhand = await makeAttack( ossu, weapon );
let offhand  = await makeAttack( ossu, weapon2 );

ChatMessage.create({ content:
    `Main attack ${renderInlineRoll(mainhand.attack)} dealing ${renderInlineRoll(mainhand.damage)} damage.
    <br> 
    Offhand attack  ${renderInlineRoll(offhand.attack)} dealing ${renderInlineRoll(offhand.damage)} damage.`
});
