/*

part inspiration: https://github.com/tomas/dialog


*/
const { join }  = require('path');
//const { spawn } = require('child_process');
const os_name = process.platform;
const unsupported = ['darwin', 'linux'];

(async () => {

    const run = function(cmd) {
        const [ bin, ...args ] = cmd;
        let stdout = '';
        let stderr = '';
        const { exec } = require('child_process');

        return new Promise((resolve, reject) => {
            // const child = spawn(bin, args, {
            //     detached: false
            // });

            // child.stdout.on('data', function(data) {
            //     stdout += data.toString();
            // })

            // child.stderr.on('data', function(data) {
            //     stderr += data.toString();
            // })

            // child.on('exit', function(code) {
            //     resolve({ code, stdout, stderr });
            // })
            exec(cmd.replace(/\/d\//g, ''), {'shell':'powershell.exe', detached: true}, (error, stdout, stderr)=> {
                // do whatever with stdout
                resolve({ error, stdout, stderr })
            })
        });
    }

    const cmd = [];
    if (unsupported.includes(os_name)){
        console.log('OS not currently supported');
        return;
    }

    //cmd.push('wscript');
    //powershell -noprofile -command
    // cmd.push('powershell.exe');
    // cmd.push('-noprofile');
    // cmd.push('./dialog.ps1');
    // cmd.push('-noprofile');
    // cmd.push('-command');
    // const command = `Add-Type -AssemblyName System.Windows.Forms;$f=new-object Windows.Forms.OpenFileDialog;$f.InitialDirectory= [environment]::GetFolderPath('Desktop');$f.Filter='Text Files(*.txt)^|*.txt^|All Files(*.*)^|*.*';$f.Multiselect=$true;[void]$f.ShowDialog();if($f.Multiselect) {$f.FileNames}else{$f.FileName}`
    const command = `
Add-Type -AssemblyName System.Windows.Forms;
$f=new-object Windows.Forms.OpenFileDialog;
$f.InitialDirectory= [environment]::GetFolderPath('Desktop');
$f.Filter='Text Files(*.txt)^|*.txt^|All Files(*.*)^|*.*';
$f.ShowHelp=$false;
$f.Multiselect=$true;
[void]$f.ShowDialog((new-object Windows.Forms.Form -Property @{TopMost = $true; TopLevel = $true }));
if($f.Multiselect) {
    Write-Host $f.FileNames;
}else{
    Write-Host $f.FileName;
}`;
    // cmd.push(`"& ${command}"`);
    //cmd.push(join(__dirname, 'dialog.vbs'));
    //const str = 'str';
    //https://www.tutorialspoint.com/vbscript/vbscript_dialog_boxes.htm
    //const type = 0; //okay
    //const title = 'title'
    //cmd.push(str) && cmd.push(type) && cmd.push(title);

    // const { code, error, stdout, stderr } = await run(command || `
    //     Add-Type -AssemblyName System.Windows.Forms
    //     $FileBrowser = New-Object System.Windows.Forms.OpenFileDialog
    //     $FileBrowser.filter = "Txt (*.txt)| *.txt"
    //     [void]$FileBrowser.ShowDialog()
    //     $FileBrowser.FileName
    // `);
    // console.log({ code, stdout, stderr });

    const Shell = require('node-powershell');
    const ps = new Shell({
        executionPolicy: 'Bypass',
        noProfile: false
    });

    // ps.addCommand('echo hello');
    ps.addCommand('./dialog.ps1');
    const output = await ps.invoke();
    console.log(output.split('\r\n'))
})();
