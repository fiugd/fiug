//http://www.lihaoyi.com/post/BuildyourownCommandLinewithANSIescapecodes.html
const rainbow = (text, base, step=3) => {
	return text.split('\n').map((x, i) => {
		// if(i % 2 !== 0){
		// 	return x;
		// }
		return `\x1B[38;5;${Math.floor(base+(i/step))}m ${x}`
	}).join('\n') + `\x1B[0m`;
};

const motd1 = rainbow(`
                                                    :
                                                   t#,     G:
  .                         j.                    ;##W.    E#,    :
  Ef.                    .. EW,       GEEEEEEEL  :#L:WE    E#t  .GE
  E#Wi                  ;W, E##j      ,;;L#K;;. .KG  ,#D   E#t j#K;
  E#K#D:               j##, E###D.       t#E    EE    ;#f  E#GK#f
  E#t,E#f.            G###, E#jG#W;      t#E   f#.     t#i E##D.
  E#WEE##Wt         :E####, E#t t##f     t#E   :#G     GK  E##Wi
  E##Ei;;;;.       ;W#DG##, E#t  :K#E:   t#E    ;#L   LW.  E#jL#D:
  E#DWWt          j###DW##, E#KDDDD###i  t#E     t#f f#:   E#t ,K#j
  E#t f#K;       G##i,,G##, E#f,t#Wi,,,  t#E      f#D#;    E#t   jD
  E#Dfff##E,   :K#K:   L##, E#t  ;#W:    t#E       G#t     j#t
  jLLLLLLLLL; ;##D.    L##, DWi   ,KK:    fE        t       ,;
              ,,,      .,,                 :
`, 28) + `
	          The consequences. Will never. Be. The SAME!

`;

const motd1o1 = rainbow(`
  |            .
  |-. ,-. ,-. -|- ,-. . ,
  | | ,-| |    |  | | |/
  '-' '-^ '    |  '-' |\\
                      ' \\
`, 196, 1) + `     ✨  let's go! ✨\n\n`;



const motd2 = `\x1B[1;3;36m
      ..                                  s                      ..
. uW8"                                   :8                < .z@8"'
't888                      .u    .      .88           u.    !@88E
 8888   .         u      .d88B :@8c    :888ooo  ...ue888b   '888E   u
 9888.z88N     us888u.  ="8888f8888r -*8888888  888R Y888r   888E u@8NL
 9888  888E .@88 "8888"   4888>'88"    8888     888R I888>   888E'"88*"
 9888  888E 9888  9888    4888> '      8888     888R I888>   888E .dN.
 9888  888E 9888  9888    4888>        8888     888R I888>   888E~8888
 9888  888E 9888  9888   .d888L .+    .8888Lu= u8888cJ888    888E '888&
.8888  888" 9888  9888   ^"8888*"     ^%888*    "*888*P"     888E  9888.
 '%888*%"   "888*""888"     "Y"         'Y"       'Y"      '"888*" 4888"
    "'       ^Y"   ^Y'                                        ""    ""

\x1B[0m
	        What's getting in YOUR way to success??
`;

const motd3 = `\x1b[1;36m

@@@@@@@    @@@@@@   @@@@@@@   @@@@@@@   @@@@@@   @@@  @@@
@@@@@@@@  @@@@@@@@  @@@@@@@@  @@@@@@@  @@@@@@@@  @@@  @@@
@@!  @@@  @@!  @@@  @@!  @@@    @@!    @@!  @@@  @@!  !@@
!@   @!@  !@!  @!@  !@!  @!@    !@!    !@!  @!@  !@!  @!!
@!@!@!@   @!@!@!@!  @!@!!@!     @!!    @!@  !@!  @!@@!@!
!!!@!!!!  !!!@!!!!  !!@!@!      !!!    !@!  !!!  !!@!!!
!!:  !!!  !!:  !!!  !!: :!!     !!:    !!:  !!!  !!: :!!
:!:  !:!  :!:  !:!  :!:  !:!    :!:    :!:  !:!  :!:  !:!
 :: ::::  ::   :::  ::   :::     ::    ::::: ::   ::  :::
:: : ::    :   : :   :   : :     :      : :  :    :   :::

\x1B[0m
                 Falls of my radar!
`;

const motd4 = `
;;,,,''''',;o0XXX0xdxOOkxxxkO00KKXXXXXNNNNNNNNNNXXK00Okkxddoollllolccllc,......'
:;;;,,,,,,,;ckKXKOdlldxxdxxkO0KKXXNNNWWWNNNNWWNNNXXKK0OOkxddooooooollcllc;.....'
::;;;,,,,,:ldOKXKkolloxxxxkO0KXXNNNWWWWWWWWWWWNNNXXKKK00Okxddooddooooolllc:,...'
c::;;;,,;;cd0XXX0xl:coxkkkO0KXXNNWWWMMMMMWWWWWWWNNXXKK00OOkxdddxxxooolollc:,...'
::::;;,,,;:oOKXKOo::cxOOOO0KXXNWWWWWWWWWWWWMMWWWWNXXXKK0OOkkxxkOOkdolllllc:'...'
::::;;;;;;:lxO00klcox00OOO0KXNNWWWWWWWWWWWMMMMWWWNNXXXK00OOOkkkOOkxolllllc:'...'
c:::;;;;;;;:ldkkdodxkkkkkkO0KXXNNWWWNNNNWWWMMMMWWWWNNXKK00OOOkkxxxdollcc:;'....'
c:::;;;;;;;;;coooxxdl:clcccldkOKKXXXXXXXXXNNNNWWWNNXXXKKK0OOkkxdllllolc:,......'
c:::;;;;;;;;;:::okko;''''....,:oxO00000OOOOkxxkOOO00KKKK00Okxdoc::ccll:,.......'
::::;;;;;;;;;;;:dkxl::lllcc:,...;dOKK0xl:;,''.',:loddxkOOOOkdlc:::::::;....  ...
c:::;;;;;;;;;:loxkkxodxkO0K0xo:';xKNNKxc;;,,,,...',;:cldxkkxdc:;;;;;;;,.     ...
cc:::::::;::;:odxO00kxddxkkOO0kod0NNNXK0Okxxkkocloc,;cldxkkxoc;::::;,'..     ...
lcccc:::::::;;clokOKK000000OOxooOXNNXXXXX0kkkO0000kooodkkkxdoc::::cc:,.      ...
llccccc:::::;;;cldxO0KXXXKKOxllxKXNXKXXNNX0xdxkOOOOOOOOOkxdoool::ccc,.       ...
llcccccc:::::;;:llodxO00KK0kolx0XXXXKKXXXXXKOO0000KK00Okxdollodoooc'.         ..
lllllccccc::::::cllodkOO00Oxox0KXXK000KKXXNXXKKKKKK0OOkxdlcclodol:.           ..
lllllcccc::::;;;:llodxkkOkocldkOKK0OO0O00KXXXKK0OOkkkxxdoccclooc,.            ..
llllccccc:::;,,,:ccllodddl,..';cllccldxkkO0K0000Okkkxdolc:clol;..             ..
llcc::;;,,''...';ccc:cllc,.....';:::cdkOOkkOOOOOOkkxdolc:;''..                ..
;,,,''..........';c:::;;;,...',coxOOO0000Okxxkkkkkxdolc:;..                    .
'''''............';;::,'',;:clddodxkkkkkkkkxddxxxxdocc:;..                     .
,''''.............';;:,....',;:cccclloooooddoodddolcc:,..                      .
'''''..............';:;,'..';:ccccccclllllllooooollc:,..                     ...
,''''...............';:clc,',;:cloddxxxkxxdddddoolc;'......            ..    ..'
;,,,,'...............';coddoooollloodxxkkkkxddollc;.. .....                  ..'
`;

const motd5 = rainbow(`
░░░░░░░░░░░░░,,'.,cllcc;,',,;:cloxkkkO000KKKKKXXXXXXXKKKKK0000KX0xc;,░░░░░░░░░░░
░░░░░░░░░░░░,'...,;::;,,'',,;:clodxkkOO000KKKKKKKKKKKKKKK00OOO0XKOdc;░░░░░░░░░░░
░░░░░░░░░░░;'......'''''''',,;:llodxkO0000KKKKKKKKKKKKKK000OO00KKOko;░░░░░░░░░░░
░░░░░░░░░░░:;. ..........'',,;cloodxkOO0KKKKKKKKKKKKKKKKK0OOOO00Okxo;░░░░░░░░░░░
░░░░░░░░░░,'..  ...........',;::loodxxkO00KKKK000KKKKKKK00OOkxxxdxd:,░░░░░░░░░░░
░░░░░░░░░░.      .....'..........',;;:lddxkOOOOOOOOkkxxxxxkkxdloolc,░░░░░░░░░░░░
░░░░░░░░░░.         .',... . ........ ..',cdxkkdl:,...';cc:cxkdoo:,░░░░░░░░░░░░░
░░░░░░░░░░,.        .,;'..     ...,;.     .cxOOo,.....',,;:cxkxl,'░░░░░░░░░░░░░░
░░░░░░░░░░░...      .',''..   ...'lo,..   .;xOOkl,,;..':,.:xOkxl:,░░░░░░░░░░░░░░
░░░░░░░░░░░,...     ....,;::;,,:cllcc,... .,dOOOkdoolldxdodkkkxo;░░░░░░░░░░░░░░░
░░░░░░░░░░░░,..       ...;oxxxxxxxxoc,.....'oO0O00OOOO0000Okkkx:░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░,..       ..,lxxkkkkkxo:'.... 'oO0OO0KK0KKKKK0Okkc░░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░,.        .,coxxxxxddl:'.    ,dO0OO0KKKKKKK0OOOo,░░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░░░░..     .':loodddddo:.     .lkOOOO0KKKKK00kko;░░░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░░░░;.      .,clooooool;.      .:lcdO00KKK00Oxc'░░░░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░░░░:,.      .;cloooooc:;..   .,oxxO0000KK00Oo,░░░░░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░░░░,c,       .;clolcccc:cc::;:xO000000O000Od:░░░░░░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░░░ .od;      .':cc;;;;;:cllloxxxkOOOOOOkOOxc░░░░░░░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░.  .dkxc.    ..,c:;,'......',:::cloodxkkkxl,░░░░░░░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░.    ;xkkd;.   ..;cc;,.....,;::lodxxxxxkkxo,░░░░░░░░░░░░░░░░░░░░░░░
░░░░░░░░░░░.       ;xkxxl,.   .,::;,::',;;:ocodxkkOOkko;░░░░░░░░░░░░░░░░░░░░░░░░
░░░░░░░░░.          ;xkxxdl,.  .';clllloodxkkOOOOOOOxl,░░░░░░░░░░░░░░░░░░░░░░░░░
░░░░░░░.             ,okkxdlc,.  .':ldxkOO000KKK00kd:,░░░░░░░░░░░░░░░░░░░░░░░░░░
░░░░░.                .,lxkdoc:;'....;oxkkOOkO00Od:,░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░..                     .,cdxdooddlc::::coooxO0O;  ....░░░░░░░░░░░░░░░░░░░░░░░░
.                           .,ok0KKKX0OxoldkOKXNk.       .....░░░░░░░░░░░░░░░░░░
                             ..,lOXXKKXXXOk0KXXXd.             ..░░░░░░░░░░░░░░░
                              ';''o0KKXXNKkOXXXX0,                ..'░░░░░░░░░░░
                               ';'.;OXXXNX0KNXXNXd.                 .'░░░░░░░░░░
                                ...cO0O000OOOOkkx,                   .'░░░░░░░░░
                              .'.. ..'.',cdxxdoOO'                     .░░░░░░░░
                               lOkxd:.   .';:co0Xl                      .░░░░░░░
                               .oKXX0;        ,ONO'                      .░░░░░░

`, 25, 12)
  .split('\n')
  .map(l => {
    const color = l.split('m')[0]+'m';
    return l.replace(/░/g, '\x1B[38;5;235m▓' + color);
  })
  .join('\n') +
`\x1B[38;5;246m
                             Béla Viktor János Bartók \x1B[38;5;243m
                                (1881 - 1945) RIP

\x1B[0m`;


export default [
	motd1, motd1o1, motd2, motd3, motd5/*, motd4*/
];

