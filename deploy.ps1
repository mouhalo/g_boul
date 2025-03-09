# Variables
$RemoteHost = "154.12.224.173"
$RemotePort = "1022"
$RemoteUser = "root"
$RemotePass = "FKdRV6woaxVP"
$AppName = "g_boul"
$RemoteDir = "/opt/$AppName"

# Create a temporary directory for the build
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
    "package-lock.json"
)

foreach ($file in $FilesToCopy) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination "deploy\" -Force
    } else {
        Write-Warning "File not found: $file"
    }
}

# Copy directories
if (Test-Path "src") {
    Copy-Item -Path "src" -Destination "deploy\" -Recurse -Force
}
if (Test-Path "public") {
    Copy-Item -Path "public" -Destination "deploy\" -Recurse -Force
}

# Create SSH command with password
$sshCmd = "plink -ssh -P $RemotePort -l $RemoteUser -pw $RemotePass $RemoteHost"

# Create remote directory and set up environment
Write-Host "Setting up remote environment..."
$setupCmd = @"
mkdir -p $RemoteDir/certbot/conf $RemoteDir/certbot/www
"@
Write-Output $setupCmd | & $sshCmd

# Transfer files using pscp
Write-Host "Transferring files to remote server..."
Get-ChildItem -Path "deploy" | ForEach-Object {
    & pscp -P $RemotePort -pw $RemotePass -r $_.FullName "${RemoteUser}@${RemoteHost}:${RemoteDir}/"
}

# Deploy application
Write-Host "Deploying application..."
$deployCmd = @"
cd $RemoteDir && 
docker compose -f docker-compose.prod.yml down &&
docker compose -f docker-compose.prod.yml build --no-cache &&
docker compose -f docker-compose.prod.yml up -d
"@
Write-Output $deployCmd | & $sshCmd

# Cleanup
Write-Host "Cleaning up..."
Remove-Item -Path "deploy" -Recurse -Force

Write-Host "Deployment completed! Application should be accessible at http://$RemoteHost"
