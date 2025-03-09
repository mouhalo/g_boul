# Configuration
$RemoteHost = "154.12.224.173"
$RemotePort = "1022"
$RemoteUser = "root"
$RemoteDir = "/opt/g_boul"

# Create deployment package
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
    }
}

# Copy source directories
if (Test-Path "src") {
    Copy-Item -Path "src" -Destination "deploy\" -Recurse -Force
}
if (Test-Path "public") {
    Copy-Item -Path "public" -Destination "deploy\" -Recurse -Force
}

# SSH commands
$sshOptions = "-o StrictHostKeyChecking=no"

# Create remote directory
Write-Host "Creating remote directory..."
ssh $sshOptions -p $RemotePort "${RemoteUser}@${RemoteHost}" "mkdir -p $RemoteDir"

# Transfer files
Write-Host "Transferring files..."
scp $sshOptions -P $RemotePort -r deploy/* "${RemoteUser}@${RemoteHost}:${RemoteDir}/"

# Deploy application
Write-Host "Deploying application..."
$deployCommands = @"
cd $RemoteDir
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
"@

$deployCommands | ssh $sshOptions -p $RemotePort "${RemoteUser}@${RemoteHost}"

# Cleanup
Write-Host "Cleaning up..."
Remove-Item -Path "deploy" -Recurse -Force

Write-Host "Deployment completed! Application should be accessible at http://$RemoteHost"
Write-Host "Note: It may take a few minutes for the application to fully start up."
