# Variables
$RemoteHost = "154.12.224.173"
$RemotePort = "1022"
$RemoteUser = "root"
$RemotePass = "FKdRV6woaxVP"
$RemoteDir = "/opt/g_boul"

# Prepare deployment directory
Write-Host "Creating deployment package..."
New-Item -ItemType Directory -Force -Path "deploy" | Out-Null

# Copy required files
Write-Host "Copying files..."
$FilesToCopy = @(
    "Dockerfile",
    "docker-compose.prod.yml",
    "nginx.conf",
    ".dockerignore",
    "next.config.js",
    "package.json",
    "package-lock.json",
    "remote-setup.sh"
)

foreach ($file in $FilesToCopy) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination "deploy\" -Force
    }
}

# Copy source directories
if (Test-Path "src") {
    Copy-Item -Path "src" -Destination "deploy\" -Recurse -Force
}
if (Test-Path "public") {
    Copy-Item -Path "public" -Destination "deploy\" -Recurse -Force
}

# Create a temporary script for SSH commands
$sshScript = @"
mkdir -p $RemoteDir
cd $RemoteDir
chmod +x remote-setup.sh
./remote-setup.sh
"@

# Save SSH commands to a file
$sshScript | Out-File -FilePath "deploy\ssh-commands.sh" -Encoding UTF8

# Use PowerShell to execute SSH commands
Write-Host "Connecting to remote server and executing commands..."
$sshpass = "sshpass -p `"$RemotePass`""
$sshOptions = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

# Transfer files
Write-Host "Transferring files..."
$transferCmd = "$sshpass scp $sshOptions -P $RemotePort -r deploy/* $RemoteUser@$RemoteHost`:$RemoteDir/"
$transferCmd | cmd /c

# Execute remote commands
Write-Host "Executing deployment commands..."
$remoteCmd = "$sshpass ssh $sshOptions -p $RemotePort $RemoteUser@$RemoteHost 'bash -s' < deploy/ssh-commands.sh"
$remoteCmd | cmd /c

# Cleanup
Write-Host "Cleaning up..."
Remove-Item -Path "deploy" -Recurse -Force

Write-Host "Deployment process completed!"
Write-Host "Your application should be accessible at http://$RemoteHost"
Write-Host "Note: It may take a few minutes for the application to fully start up."
