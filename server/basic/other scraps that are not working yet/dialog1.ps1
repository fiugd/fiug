function Show-Process($Process, [Switch]$Maximize)
{
  $sig = '
    [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern int SetForegroundWindow(IntPtr hwnd);
  '

  if ($Maximize) { $Mode = 3 } else { $Mode = 4 }
  $type = Add-Type -MemberDefinition $sig -Name WindowAPI -PassThru
  $hwnd = $process.MainWindowHandle
  $null = $type::ShowWindowAsync($hwnd, $Mode)
  $null = $type::SetForegroundWindow($hwnd)
}

# Add-Type -AssemblyName System.Windows.Forms
# $FileBrowser = New-Object System.Windows.Forms.OpenFileDialog
# $FileBrowser.filter = "Txt (*.txt)| *.txt"
# [void]$FileBrowser.ShowDialog()
# $FileBrowser.FileName


Add-Type -AssemblyName System.Windows.Forms;
$topform = New-Object System.Windows.Forms.Form
$topform.Topmost = $true
$topform.MinimizeBox = $true
$topform.Text ='GUI for my PoSh script'
$topform.Width = 600
$topform.Height = 400
# $topform.ShowDialog()

$f=new-object Windows.Forms.OpenFileDialog;
$f.InitialDirectory= [environment]::GetFolderPath('Desktop');
# $f.Filter='Text Files(*.txt)^|*.txt^|All Files(*.*)^|*.*';
$f.filter = "All Files (*.*)| *.*"
$f.ShowHelp=$false;
$f.Multiselect=$true;

$topform.controls.AddRange(@($f))

# [void]$f.ShowDialog((new-object Windows.Forms.Form -Property @{TopMost = $true; TopLevel = $true }));
[void]$f.ShowDialog($topform);
$topform.ShowDialog()



if($f.Multiselect) {
    Write-Host $f.FileNames;
}else{
    Write-Host $f.FileName;
}

# launch Notepad minimized, then make it visible
# $notepad = Start-Process notepad.exe -WindowStyle Minimized -PassThru
# Start-Sleep -Seconds 2
# Show-Process -Process $notepad
# # switch back to PowerShell, maximized
# Start-Sleep -Seconds 2
# Show-Process -Process (Get-Process -Id $PID) -Maximize
# # switch back to Notepad, maximized
# Start-Sleep -Seconds 2
# Show-Process -Process $notepad -Maximize
# # switch back to PowerShell, normal window
# Start-Sleep -Seconds 2
# Show-Process -Process (Get-Process -Id $PID)