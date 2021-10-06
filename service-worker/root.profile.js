export const profile = () => {
	return `
# configure prompt here
# https://phoenixnap.com/kb/change-bash-prompt-linux
# http://bashrcgenerator.com/

# [\\033[38;2;{R};{B};{B}m <-- RGB foreground ON
# [\\033[39m               <-- RGB foreground OFF
# [\\033[37m[\\033[1m       <-- white, bold
# [\\033[0m                <-- all styles off

`.trim() + 
'\nexport PS1="[\\033[38;2;60;180;190m\\h[\\033[39m [\\033[38;2;0;255;0m\\W[\\033[39m\\n[\\033[37m[\\033[1m\\$ [\\033[0m"' +
'\n';
}