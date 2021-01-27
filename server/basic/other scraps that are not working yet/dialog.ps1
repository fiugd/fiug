# Add-Type -AssemblyName System.Windows.Forms
# $browser = New-Object System.Windows.Forms.FolderBrowserDialog
# $null = $browser.ShowDialog()
# $browser.SelectedPathode
# Set-ForegroundWindow (Get-Process PowerShell).MainWindowHandle


# (New-Object -ComObject WScript.Shell).AppActivate((get-process PowerShell).MainWindowTitle)

# $application = New-Object -ComObject Shell.Application
# $result = $application.BrowseForFolder(0, 'Select a folder', 0)
# $result.Self.Path

# Add-Type -AssemblyName Microsoft.VisualBasic
# # $result = [Microsoft.VisualBasic.Interaction]::MsgBox('MESSAGE','YesNo,SystemModal,Information', 'TITLE')
# Write-Host $result

$AssemblyList = [System.AppDomain]::CurrentDomain.GetAssemblies();

# foreach ($Type in $AssemblyList[5].GetTypes()) {
#     $MethodList = $Type.GetMethods();
#     foreach ($Method in $MethodList) {
#         $Type.Name + ' ' + $Method.Name;
#     }
# }
Add-Type -AssemblyName Microsoft.VisualBasic
$MethodList = Microsoft.VisualBasic.GetMethods();
    foreach ($Method in $MethodList) {
        $Type.Name + ' ' + $Method.Name;
    }